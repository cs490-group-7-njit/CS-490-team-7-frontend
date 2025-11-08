import React from "react";
import { Link } from "react-router-dom";

const ClientsPage = () => {
  const clients = [
    { id: 1, name: "Sarah Jones", service: "Hair Color", status: "Active" },
    { id: 2, name: "Emma Lee", service: "Facial", status: "Inactive" },
  ];

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Clients</h1>
      <div style={{ margin: "1rem 0" }}>
        <Link to="/clients/new">+ Add Client</Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Service</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.service}</td>
              <td>{c.status}</td>
              <td>
                <button>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientsPage;
