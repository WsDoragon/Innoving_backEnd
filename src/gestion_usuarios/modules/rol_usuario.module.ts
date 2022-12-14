import { Router } from 'express';
import RolUsuariosRoute from './routes/rol_usuarios.route';

class RolUsuarioModule {

    public routes: Router;

    public constructor() {
        this.routes = Router();
        this.routes.use('/r_u', RolUsuariosRoute);
    }
}

export default new RolUsuarioModule();