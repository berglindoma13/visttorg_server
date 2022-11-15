"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./routes");
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
var jsonParser = body_parser_1.default.json();
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
var whitelist = ['http://localhost:3000', 'https://vistbokserver.herokuapp.com', 'https://visttorg-primary.vercel.app', 'https://www.vistbok.is', 'http://localhost:3333', 'https://eu1.make.com', 'https://vistbokadmin.sanity.studio'];
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        }
        else {
            // callback(new Error('Not allowed by CORS'))
            callback(null, true);
        }
    }
};
app.use((0, cors_1.default)(corsOptions));
app.use(jsonParser);
app.use(express_1.default.static('images'));
app.use('/', routes_1.routes);
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
