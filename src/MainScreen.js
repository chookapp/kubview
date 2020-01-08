import React from 'react';
import k8sproxy from './k8sproxy_mock.js';

import "./style.css"

function ItemStatus(props) {
    let color = "black"
    const status = props.item.status
    if(status === "Running")
        color = "green"    
    return (
        <div style={{color: color}}>{status}</div>
    );
}

function ItemName(props) {
    return (
        <div>{props.item.name}</div>
    );
}

function ItemNamespace(props) {
    return (
        <div>{props.item.namespace}</div>
    );
}

function ItemKind(props) {
    return (
        <div><i>{props.item.kind}</i></div>
    );
}




function ItemRow(props) {
    const item = props.item
    const indent = props.indent
    return (
        <tr><td><ItemNamespace item={item}/></td><td><div style={{paddingLeft: indent*20}}><ItemName item={item}/></div></td><td><ItemKind item={item}/></td><td>{props.extra}</td><td><ItemStatus item={item}/></td></tr>
    );
}



function CustomRow(props) {
    let item = {}
    item.namespace = props.namespace
    item.kind = props.kind
    item.name = props.name
    item.status = props.status
    
    return (
        <ItemRow item={item} indent={props.indent}></ItemRow>
    );
}

CustomRow.defaultProps = {
    status: 'unknown',
};

function Pv(props) {
    const pv = props.pv;
    const indent = props.indent === undefined ? 0 : props.indent

    return (
    <React.Fragment> 
        <ItemRow item={pv} extra={pv.size} indent={indent}/>
    </React.Fragment>
    );
}


function Pvc(props) {
    const pvc = props.pvc;
    const indent = props.indent === undefined ? 0 : props.indent
    
    return (
    <React.Fragment> 
        <ItemRow item={pvc} indent={indent}/>
        <Pv pv={pvc.pv} indent={indent}/>
    </React.Fragment>
    );
}

function Pod(props) {
    const pod = props.pod;
    const indent = props.indent === undefined ? 0 : props.indent
    
    return (
    <React.Fragment> 
        <ItemRow item={pod} extra={pod.node} indent={indent}/> 
        {pod.pvcs.map((pvc) => <Pvc key={pvc.key} pvc={pvc} indent={indent+1}/>)} 
        {pod.pvcNames.map((pvc) => <CustomRow key={pvc} kind="PV claim" name={pvc} indent={indent+1}/>)}
    </React.Fragment>
    );
}



function StatefullSet(props) {
    const ss = props.ss;
    const indent = props.indent === undefined ? 0 : props.indent

    return (
    <React.Fragment>
       <ItemRow item={ss} indent={indent}/> 
       {ss.pods.map((pod) => <Pod key={pod.key} pod={pod} indent={indent+1}/>)}
    </React.Fragment>
      
    );
}


class MainScreen extends React.Component {

    constructor(props) {
        super(props);     

        this.state =
        {
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

//        this.calcNewState = this.calcNewState.bind(this);
    }

    componentDidMount() {
        const k8p = new k8sproxy();
        let promises = [];
        let myData = {};

        promises.push(k8p.listPodForAllNamespaces().then((data) => { myData.pods = this.createItems(data) }));
        promises.push(k8p.listPersistentVolumeClaimForAllNamespaces().then((data) => { myData.pvcs = this.createItems(data) }));
        promises.push(k8p.listPersistentVolumeForAllNamespaces().then((data) => { myData.pvs = this.createItems(data) }));
        promises.push(k8p.listStatefulSetForAllNamespaces().then((data) => { myData.statefullsetes = this.createItems(data) }));

        Promise.all(promises).then(() => { this.setState({data: myData}); });
    }

    createItems(data) {
        let ret = []
        for (let item of data.items) {
            let newItem = {}
            newItem.kind = item.kind
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
                newItem.ownerIds = item.metadata.ownerReferences.map((or) => or.uid)
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

    render() {

        let pvs = this.state.data.pvs;
        let pvcs = this.state.data.pvcs;
        let pods = this.state.data.pods;
        let statefullsetes = this.state.data.statefullsetes;

        for(let pvc of pvcs) {
            pvs = this.extractPvs(pvc, pvs)
        }

        for(let pod of pods) {
            pvcs = this.extractPvcs(pod, pvcs)
        }
        
        for(let ss of statefullsetes) {
            const [children, remains] = this.getChildPods(ss.id, pods);
            pods = remains
            ss.pods = children
        }

        return(
            <div>

            Stateful sets:
            <table><tbody>{statefullsetes.map((ss) => <StatefullSet key={ss.key} ss={ss}/>)}</tbody></table>
           
            {pods.length > 0 &&
            <div>
            Unattached pods:
            <table><tbody>{pods.map((pod) => <Pod key={pod.key} pod={pod}/> )}</tbody></table>
            </div>
            }

            {pvcs.length > 0 &&
            <div>
            Unattached PVCs:
            <table><tbody>{pvcs.map((pvc) => <Pvc key={pvc.key} pvc={pvc}/>)}</tbody></table>
            </div>
            }

            {pvs.length > 0 &&
            <div>
            Unattached persistant volumes:
            <table><tbody>{pvs.map((pv) => <Pv key={pv.key} pv={pv}/>)}</tbody></table>
            </div>
            }

            </div>

            
        );
    }
}

export default MainScreen;