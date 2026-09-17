// src/components/demo components/table1.tsx
import React from 'react';

// Define the structure for user data
interface UserData {
  id: number; // Added an ID for key prop
  name: string;
  email: string;
  joined: string; // Assuming date is a string for simplicity
  avatar?: string; // Optional: path to avatar image
  initials?: string; // Optional: initials if no image
}

// Sample data based on the HTML
const sampleUsers: UserData[] = [
  {
    id: 1,
    name: 'Ricky Antony',
    email: 'ricky@example.com',
    joined: '30/03/2018',
    avatar: '../../assets/img/team/4.jpg', // NOTE: Adjust path
  },
  {
    id: 2,
    name: 'Emma Watson',
    email: 'emma@example.com',
    joined: '11/07/2017',
    avatar: '../../assets/img/team/13.jpg', // NOTE: Adjust path
  },
  {
    id: 3,
    name: 'Rowen Atkinson',
    email: 'rown@example.com',
    joined: '05/04/2016',
    initials: 'RA',
  },
  {
    id: 4,
    name: 'Antony Hopkins',
    email: 'antony@example.com',
    joined: '05/04/2018',
    avatar: '../../assets/img/team/2.jpg', // NOTE: Adjust path
  },
  {
    id: 5,
    name: 'Jennifer Schramm',
    email: 'jennifer@example.com',
    joined: '17/03/2016',
    avatar: '../../assets/img/team/3.jpg', // NOTE: Adjust path
  },
];

// Define props if data/handlers are passed from parent
interface Table1Props {
  // users?: UserData[]; // Example: Pass users as props
  // onEdit?: (userId: number) => void;
  // onDelete?: (userId: number) => void;
}

const Table1: React.FC<Table1Props> = (/* { users = sampleUsers, onEdit, onDelete } */) => {

  // In a real app, use props or fetch data
  const users = sampleUsers;

  // Placeholder handlers - replace with actual logic
  const handleEdit = (userId: number) => {
    console.log(`Edit user with ID: ${userId}`);
    // onEdit?.(userId); // Call prop function if provided
  };

  const handleDelete = (userId: number) => {
    console.log(`Delete user with ID: ${userId}`);
    // onDelete?.(userId); // Call prop function if provided
  };

  // NOTE: Tooltip initialization needed if using Bootstrap JS directly
  // React.useEffect(() => {
  //   const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  //   tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
  //   // Cleanup function to destroy tooltips on unmount
  //   return () => {
  //       tooltipTriggerList.forEach(tooltipTriggerEl => {
  //           const tooltipInstance = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
  //           if (tooltipInstance) {
  //               tooltipInstance.dispose();
  //           }
  //       });
  //   };
  // }, []); // Run only once on mount

  return (
    <div className="table-responsive scrollbar">
      <table className="table table-hover">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Actions</th> {/* Changed header for clarity */}
            <th scope="col">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover-actions-trigger">
              <td className="align-middle text-nowrap">
                <div className="d-flex align-items-center">
                  <div className="avatar avatar-xl">
                    {user.avatar ? (
                      <img
                        className="rounded-circle"
                        src={user.avatar} // Adjust path
                        alt={`${user.name} avatar`}
                      />
                    ) : user.initials ? (
                      <div className="avatar-name rounded-circle">
                        <span>{user.initials}</span>
                      </div>
                    ) : (
                      <div className="avatar-name rounded-circle">
                        <span>{user.name.charAt(0).toUpperCase()}</span> {/* Fallback initial */}
                      </div>
                    )}
                  </div>
                  <div className="ms-2">{user.name}</div>
                </div>
              </td>
              <td className="align-middle text-nowrap">{user.email}</td>
              <td className="w-auto">
                {/* Action buttons container */}
                {/* The 'hover-actions' class relies on CSS to show/hide on hover */}
                <div className="btn-group btn-group hover-actions end-0 me-4">
                  <button
                    className="btn btn-tertiary pe-2"
                    type="button"
                    data-bs-toggle="tooltip" // Requires Bootstrap JS or React tooltip library
                    data-bs-placement="top"
                    title="Edit"
                    onClick={() => handleEdit(user.id)}
                  >
                    {/* Requires Font Awesome setup */}
                    <span className="fas fa-edit"></span>
                  </button>
                  <button
                    className="btn btn-tertiary ps-2"
                    type="button"
                    data-bs-toggle="tooltip" // Requires Bootstrap JS or React tooltip library
                    data-bs-placement="top"
                    title="Delete"
                    onClick={() => handleDelete(user.id)}
                  >
                    {/* Requires Font Awesome setup */}
                    <span className="fas fa-trash-alt"></span>
                  </button>
                </div>
              </td>
              <td className="align-middle text-nowrap">{user.joined}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table1;