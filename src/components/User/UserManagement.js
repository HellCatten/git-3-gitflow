import React from 'react';
import './UserManagement.css';
import SingleUser from './SingleUser';
import BulkUser from './BulkUser';
import BulkUserWithGroups from './BulkUserWithGroups';

function UserManagement() {
  return (
    <div className="user-management">
      <SingleUser />
      <BulkUser />
      <BulkUserWithGroups />
    </div>
  );
}

export default UserManagement;
