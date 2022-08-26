import express from 'express';
import { allRoutes } from './allRoutes';

export const routes = express.Router();

routes.use(allRoutes);