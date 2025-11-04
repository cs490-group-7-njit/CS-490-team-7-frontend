import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const VendorForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    service: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Vendor submitted:", form);
    navigate("/vendors");
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Add Vendor</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Vendor Name</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Service</label>
          <input name="service" value={form.service} onChange={handleChange} required />
        </div>
        <div>
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange} />
        </div>
        <div>
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} />
        </div>
        <button type="submit">Save Vendor</button>
      </form>
    </div>
  );
};

export default VendorForm;
