import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * @param {{ data: { employee: import('../lib/types.js').OrgNode, isDropTarget?: boolean, reorgMode?: boolean } }} props
 */
function EmployeeNodeComponent({ data }) {
  const { employee, isDropTarget = false, reorgMode = false, isSelected = false } = data;

  return (
    <div className={`employee-node${isDropTarget ? ' employee-node--drop-target' : ''}${reorgMode ? ' employee-node--draggable' : ''}${isSelected ? ' employee-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="employee-node__name">{employee.name}</div>
      <div className="employee-node__title">{employee.title || 'No title'}</div>
      <div className="employee-node__span">{employee.directReportCount}/{employee.spanCount} span</div>
      {employee.department ? (
        <span className="employee-node__department">{employee.department}</span>
      ) : null}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(EmployeeNodeComponent);
