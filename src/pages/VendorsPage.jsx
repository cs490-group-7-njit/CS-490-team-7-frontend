// src/pages/VendorsPage.jsx
import React from "react";
import { Link } from "react-router-dom";

const VendorsPage = () => {
  const vendors = [
    { id: 1, name: "Golden Events", service: "Photobooth", status: "Active" },
    { id: 2, name: "Elite Catering", service: "Catering", status: "Inactive" },
  ];

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Vendors</h1>
      <div style={{ margin: "1rem 0" }}>
        <Link to="/vendors/new">+ Add Vendor</Link>
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
          {vendors.map((v) => (
            <tr key={v.id}>
              <td>{v.name}</td>
              <td>{v.service}</td>
              <td>{v.status}</td>
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

export default VendorsPage;
