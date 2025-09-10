import { useEffect, useState } from "react";

export default function TriageDashboard() {
  const [patients, setPatients] = useState([]);
  const [config, setConfig] = useState({ avgServiceTime: 15, numDoctors: 2 });
  const [newConfig, setNewConfig] = useState(config);

  const [form, setForm] = useState({ name: "", age: "", symptoms: "" });

  useEffect(() => {
    fetchPatients();
    fetchConfig();
  }, []);

  async function fetchPatients() {
    const res = await fetch("http://localhost:4000/patients");
    const data = await res.json();
    setPatients(data.patients);
    setConfig(data.config);
  }

  async function fetchConfig() {
    const res = await fetch("http://localhost:4000/config");
    const data = await res.json();
    setConfig(data);
    setNewConfig(data);
  }

  async function addPatient() {
    await fetch("http://localhost:4000/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", age: "", symptoms: "" });
    fetchPatients();
  }

  async function updateConfig() {
    await fetch("http://localhost:4000/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newConfig),
    });
    fetchPatients();
  }

  async function updateStatus(id, status) {
    await fetch(`http://localhost:4000/patients/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchPatients();
  }

  async function deletePatient(id) {
    await fetch(`http://localhost:4000/patients/${id}`, {
      method: "DELETE",
    });
    fetchPatients();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Smart Appointment Prioritization</h1>

      {/* Config Panel */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Configuration</h2>
        <div className="flex gap-4 mb-2">
          <input
            type="number"
            value={newConfig.avgServiceTime}
            onChange={(e) => setNewConfig({ ...newConfig, serviceTime: Number(e.target.value) })}
            className="border p-2 rounded"
            placeholder="Service Time (min)"
          />
          <input
            type="number"
            value={newConfig.numDoctors}
            onChange={(e) => setNewConfig({ ...newConfig, doctors: Number(e.target.value) })}
            className="border p-2 rounded"
            placeholder="Doctors"
          />
          <button
            onClick={updateConfig}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
        <p>
          Current: {config.numDoctors} doctors, {config.avgServiceTime} min/patient
        </p>
      </div>

      {/* Add Patient */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Add Patient</h2>
        <div className="flex gap-4 mb-2">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded"
            placeholder="Name"
          />
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="border p-2 rounded"
            placeholder="Age"
          />
          <input
            type="text"
            value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            className="border p-2 rounded"
            placeholder="Symptoms"
          />
          <button
            onClick={addPatient}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* Patients List */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Patient Queue</h2>
        {patients.map((p) => (
          <div key={p._id} className="border p-2 rounded mb-2 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{p.name} (Age {p.age})</h3>
              <p>Symptoms: {p.symptoms}</p>
              <p>
                Status: {p.status} | Severity: {p.severity} | Waiting Time:{" "}
                {p.waitingTimeMinutes} min
              </p>
            </div>
            <div className="flex gap-2">
              {p.status === "Waiting" && (
                <button
                  onClick={() => updateStatus(p._id, "In Service")}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Start
                </button>
              )}
              {p.status === "In Service" && (
                <button
                  onClick={() => updateStatus(p._id, "Done")}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Done
                </button>
              )}
              <button
                onClick={() => deletePatient(p._id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}