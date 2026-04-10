import React from 'react';
import './UserManagement.css';
import SingleUser from './SingleUser';
import BulkUser from './BulkUser';

function UserManagement() {
  return (
    <div className="user-management">
      <SingleUser />
      <BulkUser />
    </div>
  );
}

export default UserManagement;
