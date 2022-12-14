import { Usuario } from "../../entities/usuario";
import persistence from "../../../config/persistence";
import UsuarioModel from "../models/usuario.model";
import { generate, generateMultiple, validate } from '@wcj/generate-password';
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import usuariosModule from "../../modules/usuarios.module";

class UsuarioRepository {

    public async findUsuario(id: string): Promise<Usuario> {
        let Usuario: any = await UsuarioModel.findByPk(id);
        if (Usuario == null) {
            throw new Error();
        } else {
            return (<Usuario> Usuario);
        }

    }

    public async findUsuarios(): Promise<Array<Usuario>> {
        let Usuarios: Array<any> = await UsuarioModel.findAll();
        if (Usuarios.length == 0) {
            throw new Error();
        } else {
            return (<Array<Usuario>> Usuarios);
        }

    }
    //Refactoring aplicado (nodemailer y jwt)
    public async newUsuario(Usuario: Usuario, token:string): Promise<Usuario> {
        //hasheamos
        let testdata = Usuario.contraseña;
        const found = testdata.match(/[0-9]{2}[a-zA-Z]{4,9}[0-9]{4}/g)
        console.log(found);

        console.log(testdata);
        if(!found){
            const sha512 = require('hash.js/lib/hash/sha/512');
            let hashedPass=sha512().update(Usuario.contraseña).digest('hex');
            Usuario.contraseña = hashedPass;
        }
        //fin del hash

        let newUsuario: any = await UsuarioModel.create(Usuario);
        console.log("-------------------\nPrueba unitaria CP1: \n", newUsuario,"\n-------------------")

        newUsuario.update({
            token: token
        });
        
        return <Usuario> newUsuario;
    }

    public async editUsuario(currentID: string, Usuario: Usuario, dateStatus:boolean): Promise<Usuario> {
        console.log("EDITAR USUARIO - DEBUG")
        console.log(currentID, Usuario)
        //solo para proveedores
        if(dateStatus === true){
            //hasheamos
            console.log("entre en el hasheo para editar proveedores y su fecha")
            const sha512 = require('hash.js/lib/hash/sha/512');
            let hashedPass=sha512().update(Usuario.contraseña).digest('hex');
            Usuario.contraseña = hashedPass;
            
            //fin del hash
        }

        let editUsuario: any = await persistence.query(`UPDATE usuario SET rut="${Usuario.rut}", nombre='${Usuario.nombre}', apellido='${Usuario.apellido}', correo="${Usuario.correo}", contraseña="${Usuario.contraseña}" WHERE rut = "${currentID}"`
        , {type: persistence.QueryTypes.UPDATE});
        return <Usuario> editUsuario;

    }
    
    public async searchUsuarios(text: string): Promise<Array<Usuario>> {
        console.log(text)
        let Usuarios: Array<any> = await persistence.query('SELECT * FROM usuario WHERE nombre LIKE "%' + text + '%" OR apellido LIKE "%' + text + '%" GROUP BY rut', {
            model: UsuarioModel,
            mapToModel: true // pass true here if you have any mapped fields
        });
        
        if (Usuarios.length == 0) {
            throw new Error();
        } else {
            return (<Array<Usuario>> Usuarios);
        }

    }

    public async loginUsuarios(creds: any) : Promise<any>{
        let hehe:any = {
            "rut": "",
            "status": Number,
            "roles": []
        }

        //hasheamos
        let testdata = creds.password;
        const found = testdata.match(/[0-9]{2}[a-zA-Z]{4,9}[0-9]{4}/g)
        console.log(found);

        console.log(testdata);
        if(!found){
            const sha512 = require('hash.js/lib/hash/sha/512');
            let hashedPass=sha512().update(creds.password).digest('hex');
            creds.password = hashedPass;
        }
        //fin del hash


        const usuario = await persistence.query(`SELECT * FROM usuario WHERE rut = "${creds.username}" AND contraseña = "${creds.password}"`, {type: persistence.QueryTypes.SELECT})
        console.log("-------------------\nPrueba unitaria CP3: \n", usuario,"\n-------------------")
        
        if(usuario.length == 0){
            console.log("rut o contraseña erroneos")
            return ({message: "Rut/Contraseña no validos"})
        }
        if(usuario[0].status == 0){
            console.log("Usuario no habilitado");
            return({message: "Usuario no habilitado"})
        }
        if (usuario.length > 0){
            const roles = await persistence.query(`SELECT name from rol JOIN rol_usuario ON id = id_rol WHERE id_rut = "${creds.username}"`, {type: persistence.QueryTypes.SELECT})
            hehe.rut = `${creds.username}`;
            hehe.status = usuario[0].status;
            console.log(roles)
            for (let i = 0; i<roles.length; i++){   
                hehe.roles[i] =roles[i]["name"];
            }
            console.log(hehe)
            return hehe
        }
        else{
            return ({message: "Rut/Contraseña no validos"})
        }
        
    }
    
    //Revisar si se esta utilizando
    public async getAll(){
        let json:any[] = [];
        const result = await persistence.query(`SELECT * FROM usuario`, {type: persistence.QueryTypes.SELECT});

        for (let i of result){
        let rol:any = []
        const roles = await persistence.query(`SELECT name FROM rol_usuario
                                                JOIN rol ON id=id_rol
                                                WHERE id_rut ="${i.rut}"`,
                                                {type: persistence.QueryTypes.SELECT});
        for(let j of roles){
            rol.push(j.name);
        }
        let a = {"rut": i.rut, "nombre": i.nombre, "apellido":i.apellido, "correo": i.correo, "roles": rol, "status":i.status};
        
            json.push(a);
        }
        return json;
    }

    public async getAllP(){
        console.log("xd")
        let json:any[] = [];

        const result = await persistence.query(`select * FROM usuario JOIN rol_usuario ON rut=id_rut WHERE id_rol = 4`, {type: persistence.QueryTypes.SELECT});

        for (let i of result){
            let rol:any = []

            let a = {"rut": i.rut, "nombre": i.nombre + " " + i.apellido, "correo": i.correo, "roles": rol, "status":i.status};
            
            json.push(a);
        }
        console.log(result)
        return json;
    }

    public async getAllInnoving(){
        let json:any[] = [];
        //ARREGLAR
        const result = await persistence.query(`select DISTINCT 
                                                rut,nombre, apellido, correo, contraseña, status 
                                                FROM usuario 
                                                JOIN rol_usuario 
                                                ON rut=id_rut 
                                                WHERE id_rol != 4;`, {type: persistence.QueryTypes.SELECT});

        for (let i of result){
            let rol:any = []
            const roles = await persistence.query(`SELECT name FROM rol_usuario
                                                    JOIN rol ON id=id_rol
                                                    WHERE id_rut ="${i.rut}" `,
                                                    {type: persistence.QueryTypes.SELECT});
            for(let j of roles){
                rol.push(j.name);
            }
            let a = {"rut": i.rut, "nombre": i.nombre + " " + i.apellido, "correo": i.correo, "roles": rol, "status":i.status};
            
            json.push(a);
        }
        return json;
    }


    // Revisar si se estan utilizando
    public async getAllEnabled(){
        let json:any[] = [];
        const result = await persistence.query(`SELECT * FROM usuario WHERE status=1`, {type: persistence.QueryTypes.SELECT});

        for (let i of result){
            let rol:any = []
        const roles = await persistence.query(`SELECT name FROM rol_usuario
                                                JOIN rol ON id=id_rol
                                                WHERE id_rut ="${i.rut}" `,
                                                {type: persistence.QueryTypes.SELECT});
        for(let j of roles){
            rol.push(j.name);
        }
        let a = {"rut": i.rut, "nombre": i.nombre, "apellido":i.apellido, "correo": i.correo, "roles": rol, "status":i.status};
            
            json.push(a);
        }
        return json;
    }

    // Revisar si se estan utilizando
    public async getDisabled(soloInnoving: string){
        let json:any[] = [];
        let result:any
        console.log("huh?: "+ (soloInnoving))
        if(soloInnoving == "yes"){
            result = await persistence.query(`SELECT * FROM usuario JOIN rol_usuario ON rut=id_rut WHERE id_rol!=4 AND status=0 GROUP BY rut;`, {type: persistence.QueryTypes.SELECT});
            console.log("funcionarios! : "+result)
        }
        else{
            result = await persistence.query(`SELECT * FROM usuario JOIN rol_usuario ON rut=id_rut WHERE id_rol=4 AND status=0 GROUP BY rut;`, {type: persistence.QueryTypes.SELECT});
            console.log("vidca! : "+result)
        }
        let rol = "-"
        for (let i of result){
        let a = {"rut": i.rut, "nombre": i.nombre, "apellido":i.apellido, "correo": i.correo, "roles": rol, "status":i.status};
        json.push(a);
        }
        return json;
    }

    public async desactivarUser(id: string){
        let editUsuario: any = await persistence.query(`UPDATE usuario SET status = "0" WHERE rut = "${id}"`
            , {type: persistence.QueryTypes.UPDATE});
        console.log(`Usuario deshabilitado: ${id}`)
        return editUsuario;

    }

    public async activarUser(id: string){
        let editUsuario: any = await persistence.query(`UPDATE usuario SET status = "1" WHERE rut = "${id}"`
            , {type: persistence.QueryTypes.UPDATE});
        console.log(`Usuario deshabilitado: ${id}`)
        return editUsuario;

    }

    //Refactoring aplicado (NodeMailer y JWT fuera ahora)
    public async forgotPassword(email: string, token:string){
        console.log(email)

        const user = await UsuarioModel.findOne({
            where: {
                correo: email
            }
        })

        console.log(`--------------\nPrueba unitaria CP4: \n${user} \n--------------`)

        if (!user){
            throw new Error()
        }
        let test = user.toJSON()
        
        user.update({
            token: token
        });
        return(test)

    }

    //Refactoring aplicado (JWT fuera ahora, con verificacion)
    public async resetPassword(id: string, tokenV: string, password:string, verifyToken:any){
        let regExPassword = /^(?=.*[A-Z])(?=.*[0123456789])[A-Za-z\d@$!%*?&#]{8,16}$/;
            console.log("-----------------\nPrueba Unitaria CP5:\n", regExPassword.test(password) , "\n-----------------")
        if (!regExPassword.test(password)){
            console.log("contraseña no cumple estandares")
            throw new Error('la contraseña debe tener 8 a 16 caracteres, una mayuscula, 1 numero, 1 minuscula')
        }

        //console.log(verifyToken)

        if (verifyToken.id){
            console.log("se logro")
            //hasheamos
            const sha512 = require('hash.js/lib/hash/sha/512');
            let hashedPass=sha512().update(password).digest('hex');
            //fin del hash

            const resetPassword : any = await UsuarioModel.update({contraseña: hashedPass, token:""}, {
                where:{
                    rut: id,
                    token: tokenV
                }
            });
            //console.log(resetPassword)
            if (resetPassword[0] === 0){
                throw new Error('Contraseña no cambiada, rut o token no validos.')
            }
            else{
                //console.log(resetPassword[0])
                return resetPassword
            }
            
        }
        
    }

}

export default new UsuarioRepository();