# EquipGuard — Equipment Health Status & Maintenance Register Dashboard

An industrial-grade, interactive **Condition Monitoring, Diagnostic Troubleshooter, and Digital Maintenance Register Dashboard** built with **React 19**, **TypeScript**, **Tailwind CSS**, **Recharts**, and **Lucide Icons**.

Compliant with standard **ISO 55000 Asset Management** workflows and modern industrial predictive maintenance (PdM) principles with **Role-Based Access Control (RBAC)**.

---

## 🔐 Authentication & Role-Based Access Control (RBAC)

### Pre-Configured Credentials

| Role | Name | Email | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | **Arman Hossain** | `armanhossain.eee.info@gmail.com` | `arman2026**` | **Full Authority**: Add, edit, and delete Management & Non-Management employee profiles; edit employee emails, passwords, and designations; set granular permissions; full CMMS maintenance control; edit physical & standard equipment data; full parameter audit trail view. |
| **Management Employee (Manager)** | **Marcus Vance** | `marcus.vance@plant04.com` | `mfg2026` | **Executive Supervisor**: Approve work orders, edit physical equipment data & standard benchmarks, decommission machinery, sign-off maintenance, view parameter audit trail of who input measurements. |
| **Management Employee (Asst. Manager)** | **Elena Rostova** | `elena.rostova@plant04.com` | `auto2026` | **Operations & Automation Supervisor**: Edit physical data & standard benchmarks, approve work orders, view parameter input logs & author attributions. |
| **Management Employee (Jr. Supervisor)** | **Tariq Al-Mansoor** | `tariq.mansoor@plant04.com` | `tech2026` | **Shift Maintenance Supervisor**: Lower-level management. Can edit physical & standard benchmark data, submit machinery requests, perform manual parameter input, and view who input parameter readings. |
| **Non-Management Employee (Vibration Analyst)** | **David Chen** | `david.chen@plant04.com` | `vib2026` | **Field Specialist**: Has manual parameter measurement input across all equipment parameters. Can create work orders and log repair progress. **Physical asset data and standard benchmarks are strictly locked 🔒**. |
| **Non-Management Employee (Lubrication Tech)** | **Sarah Jenkins** | `sarah.jenkins@plant04.com` | `pdm2026` | **Field Specialist**: Has manual parameter measurement input across all equipment parameters. Can create work orders and log repair progress. **Physical asset data and standard benchmarks are strictly locked 🔒**. |

---

## 🛡️ Role-Based Data Calibration & Audit Governance

1. **Manual Parameter Input (Open to ALL Employees)**:
   - Any authenticated employee (Non-Management Field Specialists, Supervisors, Managers, and Admins) can log manual parameter readings.
   - Accessible via **"+ Manual Parameter Input"** on any parameter card or via the **"Full Shift Checklist"** batch tool.
   - Records the measured/observed value, status condition (Normal/Healthy, Warning, Critical), shift, and sensory inspection notes.
   - Automatically attributes the entry to the currently logged-in user with timestamp and employee ID.

2. **Physical Data & Standard Benchmark Editing (Management Only)**:
   - **Data Physical**: Equipment Name, Tag, Location, Manufacturer, Model, Serial Number, Installation Date, Operating Runtime Hours, Criticality, and Engineering Specifications (Voltage, Power, Speed, Cooling Type, Application Area).
   - **Data Standard**: Parameter Target / Benchmark standard specification rules, Priority classification (High Priority vs. Less Priority), and threshold limits.
   - **Restriction**: When Non-Management employees view the system, the *"Edit Physical & Standard Data"* button is locked 🔒. Attempting to calibrate triggers a security block stating that only Management Employees (Directors, Managers, and Junior Supervisors) are authorized.

3. **Verifiable Audit Trail (Management Visibility)**:
   - Management employees can inspect **WHO input every single parameter measurement**:
     - Parameter Cards feature an **"Inputted By"** badge displaying the operator's Name, Profile Avatar, Employee ID, Role tag (Non-Management Tech vs. Management), Timestamp, and remarks.
     - Dedicated **"Parameter Input Audit Trail & Operator Register"** modal with searchable filters by employee, equipment, status, and shift, plus single-click CSV export for ISO 55001 compliance.

---

## ⚙️ Monitored Machinery Fleet & Health Parameter Breakdown

The dashboard monitors heavy-duty continuous mill equipment, divided into **High Priority** (shift/daily/weekly checks that prevent immediate cobbles, catastrophic flashovers, or unplanned shutdowns) and **Less Priority** (monthly/shutdown preventive maintenance for long-term reliability):

### 1. Variable Frequency Drives (VFDs) — `EQ-VFD-01`
- **Application**: Used in Pinch Rolls, Flying Shears, Finishing Block, Cooling Bed Roller Tables, and Water Quenching Pumps.
- **High Priority Parameters**:
  - `DC Bus Voltage & Ripple`: Stable ~540–680V DC (for 400–480V AC); Ripple less than 5V
  - `IGBT Heatsink Temp`: Less than 65°C (Alarm at 75°C)
  - `Output Current Balance`: Phase imbalance less than 2%
  - `Braking Chopper & Resistor Temp`: Zero nuisance trips during regenerative deceleration
- **Less Priority Parameters**:
  - `Cooling Fan Current / RPM`: Smooth operation, zero bearing noise
  - `Control Card Dust & Corrosion`: Zero carbon/iron dust on PCBs
  - `Harmonic Filter Reactor Temp`: Less than 90°C (Class F/H)

### 2. DC Drives (Thyristor / SCR Converters) — `EQ-DCDRV-02`
- **Application**: Used in Roughing, Intermediate, and Continuous Mill Main Stands (Siemens Simoreg, ABB DCS800).
- **High Priority Parameters**:
  - `Armature & Field Current Stability`: Matches torque demand without hunting
  - `SCR Firing Angle (α) Symmetry`: Balanced across all 6/12 pulses
  - `Supply Sync & Phase Loss Detection`: Clean zero-crossing synchronization
  - `Tachogenerator / Encoder Feedback`: Ripple-free feedback voltage/pulses
- **Less Priority Parameters**:
  - `Snubber Circuit RC Health`: No swelling or burn marks on resistors/caps
  - `Busbar Joint Torque & Temp`: Thermography delta-T less than 10°C above ambient

### 3. DC Motors (Main Mill Stands) — `EQ-DCMTR-03`
- **Application**: Heavy-duty mill motors (400 kW to 2500+ kW) handling high impact torque as the billet enters the rolls.
- **High Priority Parameters**:
  - `Commutator Film & Brush Sparking`: Chocolate-brown patina; sparking class 1 or 1¼
  - `Carbon Brush Length & Spring Tension`: Greater than 40% original length; uniform pressure (180–220 g/cm²)
  - `Forced Cooling Blower Air Pressure`: Differential pressure switch healthy; clean filters
  - `Armature & Field Insulation Resistance (IR)`: Greater than 5 MΩ (at 500V/1000V DC)
- **Less Priority Parameters**:
  - `Polarization Index (PI)`: Greater than 2.0
  - `Commutator Runout (Concentricity)`: Less than 0.03 mm tir

### 4. Induction Motors (AC Motors) — `EQ-ACMTR-04`
- **Application**: Used in Descalers, Roller Tables, Shear Drives, Hydraulic Power Packs (HPU), Blowers, and TMT Water Pumps.
- **High Priority Parameters**:
  - `DE / NDE Bearing Temp & Vibration`: Temp less than 80°C; Vibration less than 4.5 mm/s RMS
  - `Winding Insulation Resistance (IR)`: Greater than 10 MΩ (LV), greater than 100 MΩ (MV)
  - `Phase Current & Voltage Unbalance`: Current unbalance less than 5%; Voltage unbalance less than 2%
- **Less Priority Parameters**:
  - `Shaft Grounding / Bearing Fluting (VFD Duty)`: Intact insulated NDE bearing or grounding brush
  - `Cooling Cowl & Fin Cleanliness`: Unobstructed airflow over TEFC fins
  - `Space Heater Current`: Functional when motor is stopped

### 5. Power & Converter Transformers — `EQ-XFR-05`
- **Application**: Substation Step-Down Transformers (33/11kV) and Multi-Winding Converter Duty Transformers (11kV/0.69kV).
- **High Priority Parameters**:
  - `Oil Temperature (OTI) & Winding Temp (WTI)`: OTI less than 75°C; WTI less than 85°C
  - `Buchholz Relay & PRV Status`: Zero gas accumulation; no oil leakage
  - `Silica Gel Breather Color`: Deep Blue (or Orange for non-toxic)
  - `Oil Dielectric Breakdown Voltage (BDV)`: Greater than 50 kV (new/filtered), min 30–40 kV in service
- **Less Priority Parameters**:
  - `Dissolved Gas Analysis (DGA)`: Low H2, CH4, C2H2 (Acetylene must be 0 ppm)
  - `OLTC / OCTC Contact & Earth Resistance`: Earth pit resistance less than 1 Ω; neutral earthing intact

### 6. Mill Field Sensors — `EQ-SNS-06`
- **Application**: Hot Metal Detectors (HMDs), Loop Scanners, Dual-Wavelength Pyrometers, Incremental Encoders, and Proximity Switches.
- **High Priority Parameters**:
  - `Optical Lens Cleanliness & Air Purge`: 100% clear optics; clean, dry compressed air at 1.5–2 bar
  - `Water Cooling Jacket Flow (HMD/Loop)`: Continuous flow; outlet temp less than 40°C
  - `Encoder Coupling & Shield Earthing`: Zero mechanical play; shield grounded at cabinet end only
- **Less Priority Parameters**:
  - `Sensor Alignment & Viewing Angle`: Centered on pass-line / roller table
  - `Heat-Resistant Cabling & Conduit Integrity`: Intact silicone/teflon jacket and flexible metallic conduit

### 7. PLCs & Automation Systems — `EQ-PLC-07`
- **Application**: Main Mill PLC, High-Speed Counter (HSC) Modules, Remote I/O Drops (Profibus/Profinet), and SCADA/HMI.
- **High Priority Parameters**:
  - `CPU Scan Time & Diagnostic Buffer`: Scan time less than 5–10 ms (for fast shear/loop logic); 0 I/O faults
  - `Fieldbus Signal Quality (Profibus/Profinet)`: Zero packet retries; intact bus termination resistors (ON at ends)
  - `24V DC Control Power Supply & UPS Health`: 24.0V–24.5V DC; ripple less than 100 mV; UPS battery greater than 30 min autonomy
- **Less Priority Parameters**:
  - `Instrument Earth vs. Power Earth Isolation`: Less than 1 Ω resistance; zero ground loop current on shields
  - `PLC Battery & Program/Parameter Backup`: Battery voltage healthy; up-to-date backup stored offline
  - `Panel AC / Peltier Cooler Performance`: Internal panel temp less than 30°C; positive air pressure

---

## 🛡️ Profile Editing Rules

1. **Administrator Privileges**:
   - Access to **Staff Directory & Permissions** tab.
   - Can add new Management & Non-Management employee profiles.
   - Can edit ANY employee's **Full Name**, **Email**, **Password**, **Designation**, **Role**, **Status**, and **Permissions**.
2. **Management & Non-Management Self-Editing Policy**:
   - When employees click **"My Profile"**, they can update their contact phone, department, bio/certifications, and emergency contact.
   - **Email**, **Password**, and **Official Designation** are strictly locked with a security padlock 🔒 and can only be altered by the Administrator.

---

## 🚀 Key Modules & Capabilities

### 1. Fleet Overview & Real-Time Monitoring
- **Plant Operational Availability**: Live calculation of plant operational uptime benchmarked against a 95% target.
- **Machinery Health Score Matrix**: Color-coded condition scoring (0–100%) for critical plant assets.
- **Active Alarm Stream**: High-priority alert banner with single-click triage and acknowledge actions.
- **Reliability Snapshots**: Plant-wide MTBF, MTTR, month-to-date downtime hours, and YTD maintenance expenditures.

### 2. High-Frequency Equipment Health Telemetry
- **Deep-Dive Condition Monitoring**:
  - Centrifugal Slurry Pump (`EQ-PUMP-101`)
  - 5-Axis Precision CNC Milling Center (`EQ-CNC-204`)
  - Rotary Screw Plant Air Compressor (`EQ-COMP-302`)
  - 3-Phase Induction Drive Motor 150kW (`EQ-MTR-108`)
  - Heavy-Duty Overland Belt Conveyor (`EQ-CVR-405`)
  - 400-Ton Hydraulic Forming Press (`EQ-HYD-501`)
- **Interactive Sensor Gauges**: Vibration (mm/s RMS), Temperature (°C), Discharge & Hydraulic Pressure (bar), Motor Load (kW/Amps), Spindle RPM, and Flow Rate ($m^3/h$).
- **Dynamic Safety Thresholds**: Warning (amber) and Critical (red) limits rendered with live gauge fills and Recharts trendlines.
- **Subsystem Breakdown**: Mechanical, Thermal, Electrical, and Hydraulic/Lubrication health breakdown meters.

### 3. Interactive Diagnostic & Troubleshooting Engine
- **Searchable Fault Code Knowledge Base**:
  - `ERR-VIB-01`: Excessive Radial Vibration & Impeller Cavitation
  - `ERR-TMP-03`: High Element Discharge Overheat
  - `ERR-CNC-02`: Spindle Thermal Drift & Tool Chatter Defect
  - `ERR-CVR-04`: Belt Misalignment & Tracking Drift
  - `ERR-HYD-05`: Hydraulic Pressure Decay & Internal Cylinder Drift
- **Interactive Diagnostic Flow Tree**: Step-by-step physical and telemetry verification checklist with Lockout/Tagout (LOTO) safety warnings.
- **Root Cause Probability**: Bayesian probability distribution over likely failure causes.
- **One-Click Work Order Synthesis**: Converts diagnostic findings directly into a pre-populated Maintenance Work Order with recommended parts and estimated downtime.

### 4. Digital Maintenance Register & Work Order Logbook
- **Full CMMS Register**: Track Work Orders with Work Order ID (`WO-2026-XXXX`), Equipment ID, Title, Type, Priority, Status, Assigned Technician, and Sign-Off.
- **Interactive Status Updates**: Move tasks between `Scheduled`, `In Progress`, `Pending Parts`, `Completed`, or `Cancelled` directly in the table.
- **Spare Parts Inventory & Cost Tracking**: Dynamic spare parts line items (Name, P/N, Qty, Unit Cost) with automated total cost rollup (Parts + Labor).
- **Expandable Work Order Drawer**: View root cause notes, corrective action taken, and detailed parts consumed.
- **Export & Print**:
  - **Export CSV**: One-click download of all records formatted for Microsoft Excel / Google Sheets.
  - **Export JSON**: Export register data as standard structured JSON.
  - **Print Layout**: Dedicated `@media print` CSS for physical work order slips and audit records.

### 5. Staff Directory & Permissions Management
- View, filter, and search staff profiles.
- Administrator controls to add and configure Management and Non-Management profiles.
- Granular permission toggles (Work order creation, approvals, baseline calibration, report exports).

### 6. Interactive Fault Simulator
- Simulate real-world machine failures on demand (Bearing Cavitation, Thermal Runaway, Pressure Collapse, Motor Surge).
- Test how the dashboard reacts: health score recalculation, audible visual pulses, and emergency alert creation.

### 7. Google Drive & Google Spreadsheet Cloud Database Integration (Admin Only)
- **Admin Configuration Modal**: Accessible via the gear icon next to the organization name or via the Admin dropdown (*"Company & Cloud Settings"*).
- **Configurable Cloud Links**:
  - **Google Drive Folder Link**: Cloud folder for storing equipment photos, technician repair proof photos, and user profile pictures.
  - **Google Spreadsheet Database Link**: Live Google Sheet acting as cloud database ledger for Equipment inventory, Maintenance records, and Staff directory.
  - **Google Apps Script Web App URL**: Optional endpoint for automated live synchronization.
- **Admin Permission**: Only the System Administrator (`armanhossain.eee.info@gmail.com`) can modify or change these links. Non-admins cannot alter these settings.
- **Direct Access Buttons**:
  - **Navbar**: Top-level quick buttons for `Drive ↗` and `Sheets DB ↗` when configured.
  - **Maintenance Register**: Dedicated `Google Sheet Database ↗` button beside CSV/JSON export.
  - **Equipment Health**: `Drive Photos ↗` button beside shift work logging.

---

## 💻 Running the Application

### 1. Development Server
```bash
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your web browser.

### 2. Production Build
```bash
npm run build
```
Creates a minified, production-ready build in `dist/`.
# AkijIspatEquipGuard
