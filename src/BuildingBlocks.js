import React, { useState } from 'react';

function ItemStatus(props) {
    let color = "black";
    const status = props.item.status;
    if (status === "Running")
        color = "green";
    return (<div style={{ color: color }}>{status}</div>);
}
function ItemName(props) {
    return (<b>{props.item.name}</b>);
}
function ItemNamespace(props) {
    return (<div>{props.item.namespace}</div>);
}
function ItemKind(props) {
    return (<div><i>{props.item.kind}</i></div>);
}
function ItemNameDecoration(props) {
    const indent = props.indent;
    const collapseIcon = props.collapseIcon 
    const padding = indent * (16+3+16)
    return (
        <div>            
            <div style={{ paddingLeft: padding , paddingRigth: 10, display: "inline-block"}}>        
                <div style={{display: "inline-block", paddingRight: 3}}>{collapseIcon}</div>
                {props.children}
            </div>
        </div>
    );
}

function ItemRow(props) {
    const item = props.item;       
    return (<tr><td><ItemNamespace item={item} /></td><td><ItemNameDecoration indent={props.indent} collapseIcon={props.collapseIcon}><ItemName item={item}/></ItemNameDecoration></td><td><ItemKind item={item} /></td><td>{props.extra}</td><td><ItemStatus item={item} /></td></tr>);
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

function isPodPartOfGroup(pod, groupBy) {
    return groupBy(pod)
}

export function Pod(props) {
    const [collapsed, setCollapsed] = useState(false);

    const collapseChanged = () => setCollapsed(!collapsed)

    const pod = props.pod;
    const indent = props.indent === undefined ? 0 : props.indent;
    if(!isPodPartOfGroup(pod, props.groupBy))
        return null;

    const hasChildren = pod.pvcs.length > 0 || pod.pvcNames > 0;

    const collapseIcon = hasChildren ? getCollapseIcon(collapsed, collapseChanged) : null;

    const childNodes = <>
        {pod.pvcs.map((pvc) => <Pvc key={pvc.key} pvc={pvc} indent={indent + 1} />)}
        {pod.pvcNames.map((pvc) => <CustomRow key={pvc} kind="PV claim" name={pvc} indent={indent + 1} />)}
    </>

    return (<React.Fragment>
        <ItemRow item={pod} extra={pod.node} indent={indent} collapseIcon={collapseIcon}/>
        {!collapsed && childNodes}
    </React.Fragment>);
}

function getCollapseIcon(collapsed, collapseChanged) {
    const iconSrc = collapsed ? "/plus.png" : "/minus.png"
    return <img src={iconSrc} alt="+" onClick={collapseChanged}/>;
}

export function PodContainer(props) {
    const [collapsed, setCollapsed] = useState(false);

    const collapseChanged = () => setCollapsed(!collapsed)

    const pc = props.pc;
    const indent = props.indent === undefined ? 0 : props.indent;

    const validPods = pc.pods.filter(pod => (isPodPartOfGroup(pod, props.groupBy)))
    const hasChildren = validPods.length > 0

    if (!hasChildren && !props.groupBy(pc))
        return null;

    const collapseIcon = hasChildren ? getCollapseIcon(collapsed, collapseChanged) : null;

    return (<React.Fragment>
        <ItemRow item={pc} indent={indent} collapseIcon={collapseIcon}/>
        {!collapsed &&
            validPods.map((pod) => <Pod key={pod.key} pod={pod} indent={indent + 1} groupBy={props.groupBy} />)
        }
    </React.Fragment>);
}

export function Collapsable(props) {
    const [collapsed, setCollapsed] = useState(false);

    const collapseChanged = () => setCollapsed(!collapsed)

    const collapseIcon = getCollapseIcon(collapsed, collapseChanged)

    const children = <div style={{paddingLeft: 20}}>{props.children}</div>

    if(props.text === null)
        return props.children

    if(Array.isArray(props.children) && props.children.every(c => c === false))
        return <div/>

    return (<div>
        <div style={{display: "inline-block", paddingRight: 6}}>{collapseIcon}</div>
        <div style={{display: "inline-block"}}><h3>{props.text}</h3></div>
        {!collapsed && children}
    </div>)

}
