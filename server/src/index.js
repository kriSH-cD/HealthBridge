import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => console.log(`SehatSetu API on :${config.port}`));
