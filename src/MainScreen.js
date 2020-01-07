import React from 'react';
import k8sproxy from './k8sproxy_mock.js';

function ItemStatus(props) {
    return (
    //<div style={{display: "inline-block;"}}>{props.item.status}</div>
    <span>{props.item.status}</span>
    );
}

function ItemName(props) {
    return (
    <span>{props.item.name}</span>
    );
}


function Pod(props) {
    const pod = props.pod;
    
    return (
    <div> {pod.kind} <ItemName item={pod}/> <ItemStatus item={pod}/></div>
    );
  }


function StatefullSet(props) {
    const ss = props.ss;
    const pods = ss.pods.map((pod) =>
    <li><Pod pod={pod}/></li>
    );
    return (
      <div> {ss.kind} <ItemName item={ss}/> <ItemStatus item={ss}/>
      <ul>{pods}</ul>
      </div>
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

            if (newItem.kind === "StatefulSet") {                                
                newItem.status = item.status.readyReplicas + "/" + item.status.replicas
            }

            if (newItem.kind === "Pod") {
                newItem.node = item.spec.nodeName
                newItem.ownerId = item.metadata.ownerReferences.uid
                newItem.vols = []
                for (let vol of item.spec.volumes) {
                    if ("persistentVolumeClaim" in vol) {
                        newItem.vols.push(vol.persistentVolumeClaim.claimName)
                    }
                }
            }

            if (newItem.kind === "PersistentVolumeClaim") {
                // newItem.size = item.spec.resources.requests.storage
                newItem.pv = item.spec.volumeName
            }

            if (newItem.kind === "PersistentVolume") {
                newItem.size = item.spec.capacity.storage
            }   
            ret.push(newItem)
        }
        return ret
    }

    getChildPods(id, pods) {
        let ret = [];
        let remains = [];
        for(let pod of pods) {
            if(pod.ownerId === id)
                ret.push(pod)
            else
                remains.push(pod)
        }  

        return [ret, remains];
    }


    render() {

        //let pvcs = this.state.data.pvcs;



        let pods = this.state.data.pods;


        let statefullsetes = this.state.data.statefullsetes;
        for(let ss of statefullsetes) {
            const [children, remains] = this.getChildPods(ss.id, pods);
            pods = remains
            ss.pods = children
        }


        

        // return (
        //     <h2>Gil
        //     {Object.keys(this.state.pods).length}
        //     </h2>
        // );
        return(
            <ul>{statefullsetes.map((ss) => <li><StatefullSet ss={ss}/></li>)}</ul>
        );
    }
}

export default MainScreen;