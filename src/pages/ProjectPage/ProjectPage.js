import React from 'react';
import AddMembers from '../../components/Project/AddMembers';
import ShareProject from '../../components/Project/ShareProject';
import ShareProjectWithGroups from '../../components/Project/ShareProjectWithGroups';
import ListProjectGroupMembers from '../../components/Project/ListProjectGroupMembers';
import ForkProjectToGroupUsers from '../../components/Project/ForkProjectToGroupUsers';
import AddUserToProjectForks from '../../components/Project/AddUserToProjectForks';
import ForkProjectToUsersOfGroup from '../../components/Project/ForkProjectToUsersOfGroup';
import './ProjectPage.css';

function ProjectPage() {
  return (
    <div className="project-page">
      <h1>Project Management</h1>
      <ShareProject />
      <ShareProjectWithGroups />
      <ListProjectGroupMembers />
      <ForkProjectToGroupUsers />
      <ForkProjectToUsersOfGroup />
      <AddUserToProjectForks />
    </div>
  );
}

export default ProjectPage;