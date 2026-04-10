import React from 'react';
import SingleUser from '../../components/User/SingleUser';
import BulkUser from '../../components/User/BulkUser';
import BulkUserWithGroups from '../../components/User/BulkUserWithGroups'; // New import
import './UserPage.css';

function UserPage() {
  return (
    <div className="user-page">
      <h1>User Management</h1>
      <SingleUser />
      <BulkUser />
      <BulkUserWithGroups /> {/* Added new section */}
    </div>
  );
}

export default UserPage;
