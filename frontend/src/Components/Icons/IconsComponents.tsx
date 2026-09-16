import { Mail } from "lucide-react";
import { AwsSVG } from "./SVG/AwsSVG";
import { BashSVG } from "./SVG/BashSVG";
import { BlenderSVG } from "./SVG/BlenderSVG";
import { NavContactSVG } from "./SVG/ContactSVG";
import { CpanelSVG } from "./SVG/CpanelSVG";
import { CplusSVG } from "./SVG/CplusSVG";
import { CsharpSVG } from "./SVG/CsharpSVG";
import { CSSSVG } from "./SVG/CSSSVG";
import { DigitalOcean } from "./SVG/DigitalOcean";
import { DjangoSVG } from "./SVG/DjangoSVG";
import { DotNetIcon } from "./SVG/DotNetIcon";
import { Electron } from "./SVG/Electron";
import { NavExperienceSVG } from "./SVG/ExperienceSVG";
import { Expo } from "./SVG/Expo";
import { Express } from "./SVG/Express";
import { Facebook } from "./SVG/Facebook";
import { Figma } from "./SVG/Figma";
import { Flutter } from "./SVG/Flutter";
import { Github } from "./SVG/Github";
import { GitIcon } from "./SVG/GitIcon";
import { GoLang } from "./SVG/GoLang";
import { Graphql } from "./SVG/Graphql";
import { Heroku } from "./SVG/Heroku";
import { NavHomeSVG } from "./SVG/HomeSVG";
import { HTMLSVG } from "./SVG/HTMLSVG";
import { Instagram } from "./SVG/Instagram";
import { JavascriptSVG } from "./SVG/JavascriptSVG";
import { Jquery } from "./SVG/Jquery";
import { Jupyter } from "./SVG/Jupyter";
import { Kotlin } from "./SVG/Kotlin";
import { LinkedIn } from "./SVG/LinkedIn";
import { MaterialUI } from "./SVG/MaterialUI";
import { MicrosoftSQL } from "./SVG/MicrosoftSQL";
import { MongoDB } from "./SVG/MongoDB";
import { Netlify } from "./SVG/Netlify";
import { NextJS } from "./SVG/NextJS";
import { NodeJs } from "./SVG/NodeJs";
import { Npm } from "./SVG/Npm";
import { Numpy } from "./SVG/Numpy";
import { PostgresSql } from "./SVG/PostgresSql";
import { Postman } from "./SVG/Postman";
import { NavProjectSVG } from "./SVG/ProjectsSVG";
import { Promises } from "./SVG/Promises";
import { Python } from "./SVG/Python";
import { Reacticon } from "./SVG/Reacticon";
import { Redis } from "./SVG/Redis";
import { Redux } from "./SVG/Redux";
import { NavResumeSVG } from "./SVG/ResumeSVG";
import { SocketIO } from "./SVG/SocketIO";
import { SQLicon } from "./SVG/SQLicon";
import { Swift } from "./SVG/Swift";
import { TailwindCSS } from "./SVG/TailwindCSS";
import { Telegram } from "./SVG/Telegram";
import { ThreeJs } from "./SVG/ThreeJs";
import { Twitter } from "./SVG/Twitter";
import { TypescriptSVG } from "./SVG/TypescriptSVG";
import { Vercel } from "./SVG/Vercel";
import { VisualCode } from "./SVG/VisualCode";
import { Vite } from "./SVG/Vite";
import { Webpack } from "./SVG/Webpack";
import { WebSocket } from "./SVG/WebSocket";
import { Whatsapp } from "./SVG/Whatsapp";
import { Wordpress } from "./SVG/Wordpress";
import { Youtube } from "./SVG/Youtube";
import { IconSVGType } from "./types";

const IconsComponents: Record<string, React.FC<IconSVGType>> = {
  AwsSVG,
  BashSVG,
  BlenderSVG,
  CpanelSVG,
  CplusSVG,
  CsharpSVG,
  CSSSVG,
  DigitalOcean,
  DjangoSVG,
  DotNetIcon,
  Electron,
  Expo,
  Express,
  Facebook,
  Figma,
  Flutter,
  Github,
  GitIcon,
  GoLang,
  Graphql,
  Heroku,
  HTMLSVG,
  Instagram,
  JavascriptSVG,
  Jquery,
  Jupyter,
  Kotlin,
  LinkedIn,
  Mail,
  MaterialUI,
  MicrosoftSQL,
  MongoDB,
  Netlify,
  NextJS,
  NodeJs,
  Npm,
  Numpy,
  PostgresSql,
  Postman,
  Promises,
  Python,
  Reacticon,
  Redis,
  Redux,
  SocketIO,
  SQLicon,
  Swift,
  TailwindCSS,
  Telegram,
  ThreeJs,
  Twitter,
  TypescriptSVG,
  Vercel,
  VisualCode,
  Vite,
  Webpack,
  WebSocket,
  Whatsapp,
  Wordpress,
  Youtube,
  NavContactSVG,
  NavExperienceSVG,
  NavHomeSVG,
  NavProjectSVG,
  NavResumeSVG,
};

export const IconNameList = Object.keys(
  IconsComponents,
) as (keyof typeof IconsComponents)[];

export default IconsComponents;
