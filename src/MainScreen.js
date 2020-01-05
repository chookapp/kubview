import React from 'react';
import k8sproxy from './k8sproxy_mock.js';

class MainScreen extends React.Component {

    constructor(props) {
        super(props);

        this.data = {
        };

        this.state =
        {
            pods: {},
            nodes: {},
            namespaces: {},
            pvs: {},
            pvcs: {},
            statefullsetes: {},
            deployments: {},
        }
    }

    componentDidMount() {
        const k8p = new k8sproxy();
        let promises = [];

        promises.push(k8p.listPodForAllNamespaces().then((data) => { this.data.pods = this.createItems(data) }));
        promises.push(k8p.listPersistentVolumeClaimForAllNamespaces().then((data) => { this.data.pvcs = this.createItems(data) }));

        Promise.all(promises).then(() => { this.calcNewState() });
    }

    createItems(data) {
        for (let item in data.items) {
            let newItem = {}
            newItem.kind = item.kind
            newItem.name = item.metadata.name
            newItem.namespace = item.metadata.namespace
            newItem.status = item.status.phase

            if (newItem.kind == "Pod") {
                newItem.node = item.spec.nodeName
                newItem.vols = []
                for (let vol in item.spec.volumes) {
                    if ("persistentVolumeClaim" in vol) {
                        newItem.vols.push(vol.persistentVolumeClaim.claimName)
                    }
                }
            }

            if (newItem.kind == "PersistentVolumeClaim") {
                // newItem.size = item.spec.resources.requests.storage
                newItem.pv = item.spec.volumeName
            }

            if (newItem.kind == "PersistentVolume") {
                newItem.size = item.spec.capacity.storage
            }
        }
    }

    calcNewState() {
        this.setState({ pods: this.data.pods });
    }

    render() {

        return (
            <h2>Gil
            {Object.keys(this.state.pods).length}
            </h2>
        );
    }
}

export default MainScreen;