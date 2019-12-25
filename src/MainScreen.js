import React from 'react';
import k8sproxy from './k8sproxy_mock.js';

class MainScreen extends React.Component {

    constructor(props) {
        super(props);

        this.data = {            
        };

        this.state =
        {
            pods: { },
            nodes: { },
            namespaces: { },
            pvs: { },
            pvcs: { },
            statefullsetes: { }
        }
    }
    
    componentDidMount() {
        const k8p = new k8sproxy();
        
        const p1 = k8p.listNamespacedPod("default").then((data) => {this.data.pods = data});

        Promise.all([p1]).then(this.calcNewState());

    }

    calcNewState() {
        this.setState({pods: this.data.pods});
    }

    render() {
        
        return (
        <h2>Gil 
        </h2>
        );
    }
}

export default MainScreen;