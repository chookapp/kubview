import React from 'react';
import k8sproxy from './k8sproxy_mock.js';

import Select from 'react-select';

import "./style.css"
import { StatefullSet, Pod, Pvc, Pv, Collapsable } from './BuildingBlocks';

const groupByOptions = ['node', 'namespace'].map((v) => {return {value: v, label: v} } )

class MainScreen extends React.Component {


    constructor(props) {
        super(props);     

        this.state =
        {
            groupBy: null,

            showNamespacesOptions: [],
            showNamespaces: [],

            data:
            {
                pods: [],
                nodes: [],
                namespaces: [],
                pvs: [],
                pvcs: [],
                statefullsetes: [],
                deployments: [],
            }
        }

        //this.handleGroupByChange = this.handleGroupByChange.bind(this);
    }

    componentDidMount() {
        const k8p = new k8sproxy();
        let promises = [];
        let myData = {};

        promises.push(k8p.listPodForAllNamespaces().then((data) => { myData.pods = this.createItems("Pod", data) }));
        promises.push(k8p.listPersistentVolumeClaimForAllNamespaces().then((data) => { myData.pvcs = this.createItems("PersistentVolumeClaim", data) }));
        promises.push(k8p.listPersistentVolumeForAllNamespaces().then((data) => { myData.pvs = this.createItems("PersistentVolume", data) }));
        promises.push(k8p.listStatefulSetForAllNamespaces().then((data) => { myData.statefullsetes = this.createItems("StatefulSet", data) }));

        Promise.all(promises).then(() => { 
            this.postProcessData(myData)
            this.setState({data: myData}); 
            this.setState({showNamespacesOptions: myData.namespaces.map((v) => {return {value: v, label: v} } )})
        });
    }

    postProcessData(data)
    {
        data.nodes = this.getUnique(data, "node")
        data.namespaces = this.getUnique(data, "namespace")

        for(let pvc of data.pvcs) {
            data.pvs = this.extractPvs(pvc, data.pvs)
        }

        for(let pod of data.pods) {
            data.pvcs = this.extractPvcs(pod, data.pvcs)
        }
        
        for(let ss of data.statefullsetes) {
            const [children, remains] = this.getChildPods(ss.id, data.pods);
            data.pods = remains
            ss.pods = children
        }
    }

    createItems(kind, data) {
        let ret = []
        for (let item of data.items) {
            let newItem = {}
            newItem.kind = kind
            newItem.name = item.metadata.name
            newItem.namespace = item.metadata.namespace
            newItem.id = item.metadata.uid
            newItem.status = item.status.phase
            newItem.key = newItem.namespace + ":" + newItem.name 

            if (newItem.kind === "StatefulSet") {                                
                newItem.status = item.status.readyReplicas + "/" + item.status.replicas
            }

            if (newItem.kind === "Pod") {
                newItem.node = item.spec.nodeName
                newItem.ownerIds = []
                if(item.metadata.ownerReferences)
                    newItem.ownerIds = item.metadata.ownerReferences.map((or) => or.uid);
                    
                newItem.pvcNames = []
                newItem.pvcs = []
                for (let vol of item.spec.volumes) {
                    if ("persistentVolumeClaim" in vol) {
                        newItem.pvcNames.push(vol.persistentVolumeClaim.claimName)
                    }
                }
            }

            if (newItem.kind === "PersistentVolumeClaim") {
                // newItem.size = item.spec.resources.requests.storage
                newItem.pv = item.spec.volumeName
                newItem.kind = "PV claim"
            }

            if (newItem.kind === "PersistentVolume") {
                newItem.size = item.spec.capacity.storage
                newItem.kind = "PersistentVol"
            }   
            ret.push(newItem)
        }
        return ret
    }

    getChildPods(id, pods) {
        let ret = [];
        let remains = [];
        for(let pod of pods) {
            if(pod.ownerIds.indexOf(id) !== -1)
                ret.push(pod)
            else
                remains.push(pod)
        }  

        return [ret, remains];
    }

    extractPvcs(pod, pvcs) {
        let remains = [];

        for(let pvc of pvcs) {
            const idx = pod.pvcNames.indexOf(pvc.name)
            if(idx === -1)
            {
                remains.push(pvc)
            }
            else
            {
                pod.pvcs.push(pvc);
                pod.pvcNames.splice(idx, 1);
            }
        }

        return remains;
    }


    extractPvs(pvc, pvs) {
        let remains = [];

        for(let pv of pvs) {
            if(pvc.pv === pv.name)
            {
                pvc.pv = pv
            }
            else
            {
                remains.push(pv)
            }
        }

        return remains;
    }

    getUnique(data, entry) {
        let vals = new Set();
        for(const itemArr of Object.values(data)) {
            itemArr.forEach((item) => vals.add(item[entry]))
        }
        vals.delete(undefined)
        return Array.from(vals.values())
    }
   
    handleGroupByChange = selectedOption => {
        this.setState({ groupBy: selectedOption });
    };

    handleShowNamespacesChange = selectedOption => {
        this.setState({ showNamespaces: selectedOption });
    };

    // returns an array of functions.
    // assuing we group by "node". For each node, we get a function that recives an "item" argument and checks if "item.node" equals that node
    getGroupByFunctions() {
        if (this.state.groupBy !== null) {
            if (this.state.groupBy.value === "node")
                return this.state.data.nodes.map(node => (item => item.node === node))
            if (this.state.groupBy.value === "namespace")
                return this.state.data.namespaces.map(namespace => (item => item.namespace === namespace))
        }
        return [(item => true)]
    }

    namespaceFilter = (item) => {
        if(this.state.showNamespaces === null || this.state.showNamespaces.length === 0)
            return true
        if(this.state.showNamespaces.some(ns => (ns.value === item.namespace)))
            return true
        return false
    }

    mainContent = (groupByVal, groupByFunction, pvs, pvcs, pods, statefullsetes) => {

        const tableHead = <thead><tr><th>Namespace</th><th>Name</th><th>Kind</th><th></th><th>Status</th></tr></thead>

        return (
            <div>

            <Collapsable text={groupByVal}>

                {statefullsetes.length > 0 &&
                <Collapsable text="Stateful sets">
                <table className="mainTable">{tableHead}<tbody className="mainTable">
                    {statefullsetes.map((ss) => <StatefullSet key={ss.key} ss={ss} groupBy={groupByFunction}/>)}
                </tbody></table>
                </Collapsable>
                }
            
                {pods.length > 0 &&
                <Collapsable text="Unattached pods">
                <table className="mainTable">{tableHead}<tbody className="mainTable">
                    {pods.map((pod) => <Pod key={pod.key} pod={pod} groupBy={groupByFunction}/>)}
                </tbody></table>
                </Collapsable>
                }

                {pvcs.length > 0 &&
                <Collapsable text="Unattached PVCs">
                <table className="mainTable">{tableHead}<tbody className="mainTable">
                    {pvcs.map((pvc) => <Pvc key={pvc.key} pvc={pvc}/>)}
                </tbody></table>
                </Collapsable>
                }

                {pvs.length > 0 &&
                <Collapsable text="Unattached persistant volumes">
                <table className="mainTable">{tableHead}<tbody className="mainTable">
                    {pvs.map((pv) => <Pv key={pv.key} pv={pv}/>)}
                </tbody></table>
                </Collapsable>
                }

            </Collapsable>
        </div>
        )
    }


    PvsGroupBy(pvs, groupByFunction) { return pvs.filter(pv => groupByFunction(pv)) }
    PvcsGroupBy(pvcs, groupByFunction) { return pvcs.filter(pvc => groupByFunction(pvc)) }
    PodsGroupBy(pods, groupByFunction) { return pods.filter(pod => groupByFunction(pod)) }
    StatefulsetGroupBy(statefulset, groupByFunction) {
        const validPods = this.PodsGroupBy(statefulset.pods, groupByFunction)
        const hasChildren = validPods.length > 0

        return (hasChildren || groupByFunction(statefulset))
    }
    StatefulsetsGroupBy(statefulsets, groupByFunction) { 
        return statefulsets.filter(statefulset => this.StatefulsetGroupBy(statefulset, groupByFunction))
    }

    render() {

        // not filtering by my sons... the assumption is (for all objects) that the children are of the same namespace as I am

        const filter = this.namespaceFilter

        const pvs = this.state.data.pvs.filter(obj => filter(obj));
        const pvcs = this.state.data.pvcs.filter(obj => filter(obj));
        const pods = this.state.data.pods.filter(obj => filter(obj));
        const statefullsetes = this.state.data.statefullsetes.filter(obj => filter(obj));

        
    
        let groupByValues = []
        let groupByFunctions = (v) => (item => true) 
        
        if (this.state.groupBy !== null) {
            if (this.state.groupBy.value === "node")
            {
                groupByValues = this.state.data.nodes
                groupByFunctions = (node) => (item => { if(node === null) return !item.node;
                                                        if(!item.node) return false;
                                                        return item.node === node;
                                                    }) 
            }
            if (this.state.groupBy.value === "namespace")
            {
                groupByValues = this.state.data.namespaces
                groupByFunctions = (namespace) => (item => { if(namespace === null) return !item.namespace;
                                                        if(!item.namespace) return false;
                                                        return item.namespace === namespace;
                                                    }) 
            }
        }

        return(
            <div style={{paddingLeft:"10px"}}>
            
            <div>
            <div style={{width: "200px", display:"inline-block", padding:"10px"}}>
                Group by: 
                <Select value={this.state.groupBy} isClearable onChange={this.handleGroupByChange} options={groupByOptions}/>
            </div>
            <div style={{width: "400px", display:"inline-block", padding:"10px"}}>
                Show namespaces: 
                <Select isMulti value={this.state.showNamespaces} onChange={this.handleShowNamespacesChange} options={this.state.showNamespacesOptions}/>
            </div>
            </div>

            {
            groupByValues.map(groupByVal => {
                const groupByFunction = groupByFunctions(groupByVal);
                
                return this.mainContent(groupByVal, groupByFunction,
                                        this.PvsGroupBy(pvs, groupByFunction), 
                                        this.PvcsGroupBy(pvcs, groupByFunction),
                                        this.PodsGroupBy(pods, groupByFunction),
                                        this.StatefulsetsGroupBy(statefullsetes, groupByFunction))
            })}

            {this.mainContent(null, groupByFunctions(null), 
                              this.PvsGroupBy(pvs, groupByFunctions(null)), 
                                        this.PvcsGroupBy(pvcs, groupByFunctions(null)),
                                        this.PodsGroupBy(pods, groupByFunctions(null)),
                                        this.StatefulsetsGroupBy(statefullsetes, groupByFunctions(null)))            
            }

            </div>

            
        );
    }
}

export default MainScreen;