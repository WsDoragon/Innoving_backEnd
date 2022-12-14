import { RolUsuario } from "../../entities/rol_usuario";
import persistence from "../../../config/persistence";
import RolUsuarioModel from "../models/rol_usuario.model";

class RolUsuarioRepository {

    public async addRolUsuario(id: string,roles: Array<number>): Promise<RolUsuario> {
        let query : string = `INSERT INTO rol_usuario (id_rut, id_rol) VALUES`;
        for(let i of roles){ //Preparacion de la consulta
            query = query + ` ("${id}",${i}),`;
        }
        query = query.slice(0,query.length-1); //Eliminar la ultima coma
        let changeRolUsuario = await persistence.query(query, {type: persistence.QueryTypes.INSERT});
        return <RolUsuario> changeRolUsuario;
    }

    public async changeRolUsuario(id: string,roles: Array<number>): Promise<RolUsuario> {
        console.log("EDITAR ROL USUARIO - DEBUG")
        console.log(id, roles)
        this.deleteRolUsuario_All(id);
        let changeRolUsuario = await this.addRolUsuario(id,roles);
        return changeRolUsuario;
    }

    //`delete from rol_usuario WHERE id_rut = ${id}`
    public async deleteRolUsuario_All(id: string): Promise<RolUsuario> {
        let editUsuario: any = await persistence.query(`DELETE FROM rol_usuario WHERE id_rut = "${id}"`, {type: persistence.QueryTypes.DELETE});
        return <RolUsuario> editUsuario;
    }


    public async findRolUsuario(id: string): Promise<RolUsuario> {
        let rolUsuario: any = await persistence.query(`SELECT * FROM rol_usuario WHERE id_rut = "${id}"`, {type: persistence.QueryTypes.SELECT});
        console.log("findrolusuario: "+rolUsuario)
        if (rolUsuario == null) {
            throw new Error();
        } else {
            return (<RolUsuario> rolUsuario);
        }

    }

    public async findRolUsuarios(): Promise<Array<RolUsuario>> {
        let RolUsuarios: Array<any> = await RolUsuarioModel.findAll();
        if (RolUsuarios.length == 0) {
            throw new Error();
        } else {
            return (<Array<RolUsuario>> RolUsuarios);
        }

    }
}

export default new RolUsuarioRepository();