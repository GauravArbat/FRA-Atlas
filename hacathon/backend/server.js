import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
await mongoose.connect("mongodb://127.0.0.1:27017/triage");

// --- Patient Schema ---
const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  symptoms: String,
  vitals: {
    hr: Number,
    sbp: Number,
    temp: Number,
    spo2: Number,
  },
  severity: String,  // Low | Medium | High
  score: Number,     // numeric severity score
  status: { type: String, default: "Waiting" }, // Waiting | In Service | Done
  arrivalIso: { type: Date, default: Date.now }
});

const Patient = mongoose.model("Patient", patientSchema);

// --- Config values (default) ---
let avgServiceTime = 15; // minutes
let numDoctors = 2;

// --- Severity Scoring Function ---
function calculateSeverity({ symptoms = "", vitals = {} }) {
  let severity = "Low";
  let score = 1;

  const criticalSymptoms = ["chest pain", "difficulty breathing", "stroke", "bleeding", "unconscious"];

  if (criticalSymptoms.some(cs => symptoms.toLowerCase().includes(cs))) {
    severity = "High"; score = 3;
  }

  if (vitals) {
    if (vitals.hr > 120 || vitals.hr < 50) { severity = "High"; score = 3; }
    if (vitals.sbp && vitals.sbp < 90) { severity = "High"; score = 3; }
    if (vitals.temp && vitals.temp > 39.5) { severity = "High"; score = 3; }
    if (vitals.spo2 && vitals.spo2 < 92) { severity = "High"; score = 3; }
  }

  if (severity === "Low" && symptoms.length > 0) {
    severity = "Medium"; score = 2;
  }

  return { severity, score };
}

// --- Routes ---
// Add patient
app.post("/patients", async (req, res) => {
  const { name, age, symptoms, vitals } = req.body;
  const { severity, score } = calculateSeverity({ symptoms, vitals });
  const patient = new Patient({ name, age, symptoms, vitals, severity, score });
  await patient.save();
  res.json(patient);
});

// Get patients (sorted + waiting time calculation)
app.get("/patients", async (req, res) => {
  let patients = await Patient.find().sort({ score: -1, arrivalIso: 1 });

  let waitingQueue = 0;
  patients = patients.map((p) => {
    let waitingTimeMinutes = 0;
    if (p.status === "Waiting") {
      waitingTimeMinutes = Math.floor((waitingQueue / numDoctors) * avgServiceTime);
      waitingQueue++;
    }
    return { ...p.toObject(), waitingTimeMinutes };
  });

  res.json({ patients, config: { avgServiceTime, numDoctors } });
});

// Update status
app.patch("/patients/:id/status", async (req, res) => {
  const { status } = req.body;
  const patient = await Patient.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(patient);
});

// Delete patient
app.delete("/patients/:id", async (req, res) => {
  await Patient.findByIdAndDelete(req.params.id);
  res.json({ message: "Patient removed" });
});

// Get config
app.get("/config", (req, res) => {
  res.json({ avgServiceTime, numDoctors });
});

// Update config
app.post("/config", (req, res) => {
  const { serviceTime, doctors } = req.body;
  if (serviceTime) avgServiceTime = serviceTime;
  if (doctors) numDoctors = doctors;
  res.json({ avgServiceTime, numDoctors });
});

// --- Start server ---
const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));