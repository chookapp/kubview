import React from 'react';
import k8sproxy from './k8sproxy_mock.js';

class MainScreen extends React.Component {
    render() {
        const k8p = new k8sproxy()
        const pods = k8p.listNamespacedPod("default");

        return (
        <h2>Gil</h2>
        );
    }
}

export default MainScreen;