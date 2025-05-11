declare module "*.module.css" {
    const classes: { [key: string]: string };
    export default classes;
}

declare module "react-chartjs-2" {
    export { Line } from "react-chartjs-2";
}

declare module "chart.js/auto" {
    export * from "chart.js";
}