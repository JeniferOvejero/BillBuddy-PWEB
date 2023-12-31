import Iconname from "../../assets/iconname.png"
import IconBranco from "../../assets/logo-branca.png"
import Icon from "../../assets/icon.png"
import style from "../Img.module.css"

export default function Logo({type}){
    return (
        <img
            className={
            type == 1
                ? style.icon
                : type == 2
                ? style.iconname
                : type == 3
                ? style.bigiconname
                : style["logo-branca"]
            }
            src={
            type == 1
                ? Icon
                : type == 2
                ? Iconname
                :type == 3
                ? Iconname
                : IconBranco
            }
            alt={`logo`}
        />
    )
}