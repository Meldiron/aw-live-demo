const express = require("express");
const dotenv = require("dotenv");
const CronJob = require("cron").CronJob;
const bodyParser = require("body-parser");
const axios = require("axios");
const faker = require("faker");
var cors = require("cors");

dotenv.config();

const createApiClient = (cookies = {}) => {
  return axios.default.create({
    baseURL: process.env.APPWRITE_ENDPOINT,
    timeout: 10000,
    headers: { "X-Appwrite-Project": "console", ...cookies },
  });
};

let apiServer = createApiClient();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// POST createNewInstance
app.post("/instances", async (req, res) => {
  const companyName = faker.company.companyName();
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const password = faker.random.words(2).toLowerCase().split(" ").join("-");
  const name = `${firstName} ${lastName}`;
  const userEmail = faker.internet
    .email(firstName, lastName, "sim-appwrite.io")
    .toLowerCase();

  let teamId;
  try {
    const teamResponse = await apiServer.post("teams", {
      name: companyName,
    });

    teamId = teamResponse.data["$id"];
  } catch (err) {
    return res.json({
      success: false,
      message: `🚨 Cannot create team: ${err}`,
    });
  }

  let projectId;
  try {
    const projectResponse = await apiServer.post("projects", {
      name: companyName,
      teamId,
    });

    projectId = projectResponse.data["$id"];
  } catch (err) {
    return res.json({
      success: false,
      message: `🚨 Cannot create project: ${err}`,
    });
  }

  try {
    const _inviteResponse = await apiServer.post(
      `teams/${teamId}/memberships`,
      {
        // URL never used, localhost is fine
        url: `https://localhost/auth/join?project=${projectId}`,
        roles: ["owner"],
        name,
        email: userEmail,
      }
    );

    const getMailRecursion = async (attempt = 1) => {
      if (attempt >= 10) {
        throw new Error("Email not found #1");
      }

      try {
        const mailServerResponse = await axios.default.get(
          process.env.MAILCATCHER_ENDPOINT + "email"
        );

        const mail = mailServerResponse.data.find(
          (m) => m.envelope.to[0].address === userEmail
        );

        if (!mail) {
          throw new Error("Not found");
        }

        return mail;
      } catch (err) {
        // Ignore, we will retry
      }

      // Wait 500ms
      await new Promise((pRes) => {
        setTimeout(() => {
          pRes(true);
        }, 500);
      });

      return await getMailRecursion(attempt + 1);
    };

    const mail = await getMailRecursion();

    const mailData = {};
    /*
    mailData = {
        project: '61b79752abddb',
        membershipId: '61b79752cbace',
        userId: '61b79752c9595',
        secret: '.....',
        teamId: '61b7975291478'
    }
   */

    mail.html
      .split("/auth/join?")[1]
      .split('" target="_blank"')[0]
      .split("&")
      .forEach((item) => {
        const itemChunks = item.split("=");
        mailData[itemChunks[0]] = itemChunks[1];
      });

    const registerResponse = await axios.default.patch(
      process.env.APPWRITE_ENDPOINT +
        `teams/${mailData.teamId}/memberships/${mailData.membershipId}/status`,
      {
        userId: mailData.userId,
        secret: mailData.secret,
      },
      {
        headers: {
          "X-Appwrite-Project": "console",
        },
      }
    );

    const authHeaders = {
      "x-fallback-cookies": registerResponse.headers["x-fallback-cookies"],
      "set-cookie": registerResponse.headers["set-cookie"],
    };

    const _setPasswordResponse = await axios.default.patch(
      process.env.APPWRITE_ENDPOINT + "account/password",
      { password, oldPassword: process.env.APPWRITE_ADMIN_PASSWORD },
      {
        headers: {
          "X-Appwrite-Project": "console",
          ...authHeaders,
        },
      }
    );
  } catch (err) {
    console.log(err.toJSON());
    return res.json({
      success: false,
      message: `🚨 Cannot register member: ${err}`,
    });
  }

  res.json({
    success: true,
    message: `Successfully created project 🥳`,
    data: {
      userEmail,
      password,
      projectName: companyName,
    },
  });
});

// POST cleanupUnusedInstances
app.post("/cleanup", async (req, res) => {
  const hash = req.body.hash;

  if (hash !== process.env.ADMIN_HASH) {
    return res.json({
      success: false,
      message: "🚨 Admin password not provided or invalid.",
    });
  }

  try {
    const cleanupResponse = await cleanup();
    return res.json({
      success: true,
      message: `✅ Cleaned up ${cleanupResponse.cleanedAmount} projects`,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: `🚨 Unexpected error: ${err}`,
    });
  }
});

// Start HTTP server
app.listen(process.env.API_PORT, async () => {
  console.log(`👀 Listening on port :${process.env.API_PORT}`);

  // Login into Appwrite
  try {
    const loginResponse = await apiServer.post("account/sessions", {
      email: process.env.APPWRITE_ADMIN_EMAIL,
      password: process.env.APPWRITE_ADMIN_PASSWORD,
    });

    apiServer = createApiClient({
      "x-fallback-cookies": loginResponse.headers["x-fallback-cookies"],
      "set-cookie": loginResponse.headers["set-cookie"],
    });

    console.log("🤖 Successfully logged into Appwrite");
  } catch (err) {
    console.log(err.toJSON());
    console.log(`🤖 Cannot login into Appwrite: ${err}`);
    process.exit();
  }

  // Prepare cleanup process
  const job = new CronJob("0 * * * * *", async () => {
    console.log("🧹 Cleanup initiated");
    await cleanup();
    console.log("🧹 Cleanup finished");
  });

  job.start();

  console.log("🧹 Cleanup cron started.");
});

const cleanup = async () => {
  // TODO: Implement cleanup
  return {
    cleanedAmount: 0,
  };
};
