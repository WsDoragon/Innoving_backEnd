import express, { Express, Request, Response, Router } from 'express';
import dotenv from 'dotenv'
import cors from 'cors'

//import usuariosModule from './src/modules/users/gestion_usuarios/usuarios.module';
import usuariosModule from './src/gestion_usuarios/modules/usuarios.module';
import rolUsuariosModule from './src/gestion_usuarios/modules/rol_usuario.module';


class App {
  public server;
  private port;

  constructor() {
    dotenv.config(); 
    this.port = process.env.PORT;

    console.log('initializing');

    this.server = express();

    this.middlewares();
    this.routes();

    this.server.listen(this.port, () => {
      console.log(`Server is running at https://localhost:${this.port}`);
    });
  }

  middlewares() {
    this.server.use(express.json());
    this.server.use(cors());
  }

  routes() {
    //this.server.use(UserModule.routes);
    this.server.use(usuariosModule.routes);
    this.server.use(rolUsuariosModule.routes);
  }
}

export default new App();