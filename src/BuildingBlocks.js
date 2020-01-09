import React from 'react';

function ItemStatus(props) {
    let color = "black";
    const status = props.item.status;
    if (status === "Running")
        color = "green";
    return (<div style={{ color: color }}>{status}</div>);
}
function ItemName(props) {
    return (<div>{props.item.name}</div>);
}
function ItemNamespace(props) {
    return (<div>{props.item.namespace}</div>);
}
function ItemKind(props) {
    return (<div><i>{props.item.kind}</i></div>);
}
function ItemRow(props) {
    const item = props.item;
    const indent = props.indent;
    return (<tr><td><ItemNamespace item={item} /></td><td><div style={{ paddingLeft: indent * 20 }}><ItemName item={item} /></div></td><td><ItemKind item={item} /></td><td>{props.extra}</td><td><ItemStatus item={item} /></td></tr>);
}

function CustomRow(props) {
    let item = {};
    item.namespace = props.namespace;
    item.kind = props.kind;
    item.name = props.name;
    item.status = props.status;
    return (<ItemRow item={item} indent={props.indent}></ItemRow>);
}
CustomRow.defaultProps = {
    status: 'unknown',
};

export function Pv(props) {
    const pv = props.pv;
    const indent = props.indent === undefined ? 0 : props.indent;
    return (<React.Fragment>
        <ItemRow item={pv} extra={pv.size} indent={indent} />
    </React.Fragment>);
}
export function Pvc(props) {
    const pvc = props.pvc;
    const indent = props.indent === undefined ? 0 : props.indent;
    return (<React.Fragment>
        <ItemRow item={pvc} indent={indent} />
        <Pv pv={pvc.pv} indent={indent} />
    </React.Fragment>);
}
export function Pod(props) {
    const pod = props.pod;
    const indent = props.indent === undefined ? 0 : props.indent;
    return (<React.Fragment>
        <ItemRow item={pod} extra={pod.node} indent={indent} />
        {pod.pvcs.map((pvc) => <Pvc key={pvc.key} pvc={pvc} indent={indent + 1} />)}
        {pod.pvcNames.map((pvc) => <CustomRow key={pvc} kind="PV claim" name={pvc} indent={indent + 1} />)}
    </React.Fragment>);
}
export function StatefullSet(props) {
    const ss = props.ss;
    const indent = props.indent === undefined ? 0 : props.indent;
    return (<React.Fragment>
        <ItemRow item={ss} indent={indent} />
        {ss.pods.map((pod) => <Pod key={pod.key} pod={pod} indent={indent + 1} />)}
    </React.Fragment>);
}
