import React from 'react';
import './ProjectManagement.css';
import AddMembers from './AddMembers';
import ShareProject from './ShareProject';
import ShareProjectWithGroups from './ShareProjectWithGroups';

function ProjectManagement() {
  return (
    <div className="project-management">
      <AddMembers />
      <ShareProject />
      <ShareProjectWithGroups />
    </div>
  );
}

export default ProjectManagement;
