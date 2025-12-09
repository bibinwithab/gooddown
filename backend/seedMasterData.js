// seedMasterData.js
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT || 5432,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Vehicle owners
    const owners = [
      "AARON",
      "AARUPADAI",
      "AATHI GANAPATHIPURAM",
      "ABINAYA",
      "ABIN AMMANDIVILAI",
      "ALWIN",
      "AKILAN CONTRACTOR",
      "AKILAN RAJAKKAMANGALAM",
      "ALAGU VEL PAMPANVILAI",
      "AK CONSTRUCTIONS–MIDHUN",
      "AMA BUILDERS MOTTOM",
      "AMMAN THUNAI",
      "ANAND CTM",
      "ANAND MANIKANDAN",
      "ANBEY SIVAM",
      "ANBU SWAMY GANPATHIPURAM",
      "A R M HOLLOW BRICKS",
      "APARNA",
      "ARUL SEELE",
      "ASHLIN JOHN",
      "AYYA THUNAI",
      "AYYAPPAN KOTTANAR",
      "AYYAPPAN (PAK) CONTRACTOR",
      "AZHIKAL AUTO",
      "BALA JCB",
      "BALA KURUNTHANCODE",
      "BALA KRISHNAN MONDAIKADU",
      "BASIL",
      "CMN",
      "CHELLATHANGAM",
      "CHENDUR MURUGAN",
      "CHURCH ENGINEER",
      "CHURCH ENGINEER YESUDAS",
      "CSI CHURCH AK",
      "CTM MANIKANDAN",
      "CTM MANIKANDAN DRIVER",
      "DAS MANAVALAKURICHI",
      "DEVA KIRUBAI",
      "DEVENTHIRAN",
      "DHARSHINI",
      "DHANUSH",
      "DHINESH ELLUVILAI",
      "DHINESH EATHAMOZHI",
      "DURAIRAJ AK",
      "DX",
      "EDWIN",
      "ESWARI",
      "GOBI",
      "GOOD SHEPHERD",
      "HOLLOW BRICKS-THINGAL NAGER",
      "HARSHIKA",
      "JAGAN J S",
      "JAGATHISH VEL DRIVER",
      "JAWAN AYYAPPAN",
      "JCB OPERTOR THALAKULAM",
      "JELIN",
      "JINA DEV",
      "JESUS",
      "JOSE KANNAKURICHI",
      "JOSE",
      "K KAMALAM",
      "KMS",
      "KADUVA MOOTHY",
      "KARAVILAI",
      "KALLU KATTAI PLOT",
      "KANNAN SREE KRISHNAPURAM",
      "KANNAN VELLAMODI",
      "KANTHAN KARUNAI",
      "KARUNYA",
      "KRISHNA KUMAR",
      "KUMAR SUDALAI",
      "KUMAR ANDI",
      "LAKSHMI PERUMAL",
      "LEON-KADIYAPATTANIAM",
      "MTS – ANISH",
      "MAGARA JOTHI",
      "MAHALAXMI",
      "MAHENDRAN",
      "MANIKANDA RAJA",
      "MANO SARAL",
      "MANOHARAN CONTRACTOR",
      "MANOHARAN CONTRACTOR JPR",
      "MANON MANI",
      "MARUTHI EATHAMOZHI",
      "MEEGA",
      "MICHEL THALAVAIPURAM",
      "M P B",
      "MOGAN AK",
      "MUTTOM AYYAPPAN",
      "MUTHU AK",
      "N KUMAR",
      "NANTHISH AZHAGANVILAI",
      "NARAYANAN SWANY",
      "NIRMAL CONTRACTOR",
      "NISANTH CONTRACTOR",
      "NITHANYA",
      "NELSON AMMANDIVILAI",
      "OLIVER SPENCER",
      "PABITHA",
      "PANDI",
      "PATHMANABAN",
      "PAPPY XL",
      "PAPPY SELVAN",
      "PARAMESHWARAN",
      "PILLAIYAR VILAI",
      "PON SURESH",
      "PRASANTH CONTRACTOR (A.V)",
      "POOVIYUR-MURUGAN",
      "PRINCE-AC",
      "PUNITHA ANTONIYAR",
      "R K",
      "RKM",
      "R S R",
      "R S SUTHIKA",
      "RAGAVAN CONTRACTOR",
      "RAGAVAN ESANTHANGU",
      "RAGAVAN-AK",
      "RAJA KONAM PLAT",
      "RAJAKUMAR PASTOR",
      "RAJESH WARAN",
      "RAJESH J",
      "RAMESH PUCHIKADU",
      "REST HOUSE",
      "ROBINSON CONTRACTOR",
      "RPN-SUTHAGAR",
      "S D AGENCY",
      "S S HARISH CONSTRUCTION",
      "SABAPATHY",
      "SAGALA PUNITHARGAL",
      "SAI RITHIK",
      "SAHAYA MATHA",
      "SAHAYA RAJ",
      "SANJAYA XL",
      "SANKAR GRKS",
      "SANKAR SURA AK",
      "SANTHOSH",
      "SARASWATHY",
      "SARAVANA BAVA",
      "SENBAHA",
      "SENTHIL ROSE AK",
      "SENTHIL CONTRACTOR",
      "SHABI HOTAL",
      "SHAJU",
      "SHIVANI",
      "SIVANTHAMON AUTO DRIVER",
      "SIVA LINGAM",
      "SIVA PARAMAN VILAI",
      "SREE AYYAPPAN",
      "SREE KRISHNA",
      "SREE MANIKANDAN",
      "SREE STUDIO",
      "SREE YANA",
      "SUGAN PARUTHIVILAI",
      "SUJAY",
      "SUJIN",
      "SUJITH DRIVER",
      "SUNIL MMS",
      "SUNDER MILK",
      "SURESH K.KURICHI",
      "SUSILA PILLAITHOUPPU (RED SAND)",
      "SUTHAN DRIVER",
      "SIVA KRISHNAN",
      "THANGAM CONTRACTOR",
      "THANGAPPAN",
      "THIYAGARAJAN",
      "UGEN MOTTOM",
      "V T R",
      "VARSHA",
      "VARSHA VELLAI",
      "VETHA MANI",
      "VISVA JOTHI",
      "VINU-JAYAM",
      "V K - INTERLOCK",
      "VR TEMPO",
      "YESUDAS",
      "GANAPATHIPURAM BAGS PB-3/4",
      "SIVAN TIPPER-50&50-PPC5",
      "JAYA RAJAN",
      "MOGAN",
      "SUBIN-AK-TEMPO RENT",
      "ARUL ADV PUTHUR",
    ];

    for (const name of owners) {
      await client.query(
        `INSERT INTO vehicle_owners (name)
         VALUES ($1)
         ON CONFLICT (name) DO NOTHING`,
        [name]
      );
    }

    // 2) Materials + rates
    const materials = [
      { name: "M-Sand 1", rate: 61, unit: "unit" },
      { name: "M-Sand 2", rate: 63, unit: "unit" },
      { name: "P-Sand", rate: 68, unit: "unit" },
      { name: "Jalli 1/4", rate: 53, unit: "unit" },
      { name: "Jalli 1/2", rate: 54, unit: "unit" },
      { name: "Jalli 3/4", rate: 53, unit: "unit" },
      { name: "Jalli 1 1/2", rate: 53, unit: "unit" },
      { name: "Dust", rate: 56, unit: "unit" },
      { name: "Bed Mix", rate: 53, unit: "unit" },
      { name: "Brick 1 - Pressing", rate: 9, unit: "unit" },
      { name: "Brick 2 - Chutta Kal", rate: 9.25, unit: "unit" },
      { name: "Cement", rate: 290, unit: "bag" },
    ];

    for (const m of materials) {
      await client.query(
        `INSERT INTO materials (name, rate_per_unit, unit)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE
           SET rate_per_unit = EXCLUDED.rate_per_unit,
               unit = EXCLUDED.unit`,
        [m.name, m.rate, m.unit]
      );
    }

    await client.query("COMMIT");
    console.log("✅ Seed complete");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
