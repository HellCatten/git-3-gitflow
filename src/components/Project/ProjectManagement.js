import React from 'react';
import './ProjectManagement.css';
import './ShareProject';
import AddMembers from './AddMembers';
import ShareProject from './ShareProject';

function ProjectManagement() {
  return (
    <div className="project-management">
      <AddMembers />
      <ShareProject />
    </div>
  );
}

export default ProjectManagement;
