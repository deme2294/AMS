// src/components/DemoTable.tsx
import React from 'react';

// Define the structure for user data
interface UserData {
  id: number; // Added an ID for key prop
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'Completed' | 'Processing' | 'On Hold' | 'Pending';
  amount: number;
  avatar?: string; // Optional: path to avatar image
  initials?: string; // Optional: initials if no image
}

// Sample data based on the HTML
const sampleUsers: UserData[] = [
  {
    id: 1,
    name: 'Ricky Antony',
    email: 'ricky@example.com',
    phone: '(201) 200-1851',
    address: '2392 Main Avenue, Penasauka',
    status: 'Completed',
    amount: 99,
    avatar: '../../assets/img/team/4.jpg', // NOTE: Adjust path based on your project structure/asset handling
  },
  {
    id: 2,
    name: 'Emma Watson',
    email: 'emma@example.com',
    phone: '(212) 228-8403',
    address: '2289 5th Avenue, New York',
    status: 'Completed',
    amount: 199,
    avatar: '../../assets/img/team/13.jpg', // NOTE: Adjust path
  },
  {
    id: 3,
    name: 'Rowen Atkinson',
    email: 'rown@example.com',
    phone: '(201) 200-1851',
    address: '112 Bostwick Avenue, Jersey City',
    status: 'Processing',
    amount: 755,
    initials: 'RA', // Example using initials
  },
  {
    id: 4,
    name: 'Antony Hopkins',
    email: 'antony@example.com',
    phone: '(901) 324-3127',
    address: '3448 Ile De France St #242',
    status: 'On Hold',
    amount: 50,
    avatar: '../../assets/img/team/2.jpg', // NOTE: Adjust path
  },
  {
    id: 5,
    name: 'Jennifer Schramm',
    email: 'jennifer@example.com',
    phone: '(828) 382-9631',
    address: '659 Hannah Street, Charlotte',
    status: 'Pending',
    amount: 150,
    avatar: '../../assets/img/team/3.jpg', // NOTE: Adjust path
  },
];

// Helper function or object to map status to badge class and icon
const statusStyles: Record<UserData['status'], { badgeClass: string; iconClass: string }> = {
  Completed: { badgeClass: 'badge-subtle-success', iconClass: 'fa-check' },
  Processing: { badgeClass: 'badge-subtle-primary', iconClass: 'fa-redo' },
  Pending: { badgeClass: 'badge-subtle-warning', iconClass: 'fa-stream' },
  'On Hold': { badgeClass: 'badge-subtle-secondary', iconClass: 'fa-ban' },
};


const DemoTable: React.FC = () => {
  // In a real application, you would likely fetch this data or receive it as props
  const users = sampleUsers;

  return (
    <div className="table-responsive scrollbar">
      <table className="table table-hover table-striped overflow-hidden">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Address</th>
            <th scope="col">Status</th>
            <th className="text-end" scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            // Safely access styles, provide default if status somehow doesn't match
            const styles = statusStyles[user.status] || { badgeClass: 'badge-subtle-secondary', iconClass: 'fa-question-circle' };
            const { badgeClass, iconClass } = styles;

            return (
              <tr key={user.id} className="align-middle">
                <td className="text-nowrap">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-xl">
                      {user.avatar ? (
                        <img
                          className="rounded-circle"
                          src={user.avatar} // Consider importing images or using public folder paths
                          alt={`${user.name} avatar`}
                        />
                      ) : user.initials ? (
                        <div className="avatar-name rounded-circle">
                          <span>{user.initials}</span>
                        </div>
                      ) : (
                        // Fallback if neither avatar nor initials are provided
                        <div className="avatar-name rounded-circle">
                           <span>{user.name.charAt(0).toUpperCase()}</span> {/* Example: Use first initial */}
                        </div>
                      )}
                    </div>
                    <div className="ms-2">{user.name}</div>
                  </div>
                </td>
                <td className="text-nowrap">{user.email}</td>
                <td className="text-nowrap">{user.phone}</td>
                <td className="text-nowrap">{user.address}</td>
                <td>
                  <span className={`badge badge rounded-pill d-block p-2 ${badgeClass}`}>
                    {user.status}
                    {/* NOTE: Font Awesome icons might require specific React components (e.g., @fortawesome/react-fontawesome)
                        or ensure Font Awesome JS is loaded globally */}
                    <span
                      className={`ms-1 fas ${iconClass}`}
                      data-fa-transform="shrink-2"
                    ></span>
                  </span>
                </td>
                <td className="text-end">${user.amount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DemoTable;
