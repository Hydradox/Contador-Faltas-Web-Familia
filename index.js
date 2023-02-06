require('dotenv').config();
const pup = require('puppeteer');

// Init vars
const url = 'https://familia.edu.gva.es/';
const device = pup.devices['iPad Pro 11 landscape'];
let listaAsignaturas = [];


(async () => {
    // Init browser
    const browser = await pup.launch({
        headless: false,
        //devtools: true,
        args: ['--window-size=1500,1000']
    });
    const page = await browser.newPage();

    // Configuration
    await page.emulate(device);
    await page.goto(url);


    // Login
    try {
        await page.type('#usuario', process.env.WF_USER);
        await page.type('#contrasenya', process.env.WF_PWD);
        await page.click('#bt_envia');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

    } catch (error) {
        console.log('Error al iniciar sesion: ', error);
    } finally { console.log('Inicio de sesion correcto!'); }


    // Abrir asistencias
    try {
        await page.click('.imc-listado-faltas ~ .imc-modulo-opciones.imc-modulo-opciones-on');
    } catch (error) {
        console.log('Error al abrir asistencias: ', error);
    } finally { console.log('Asistencias abiertas!'); }


    // Iterar asistencias
    const asistencias = await page.$$('.imc-com-todas-contenedor ul li');
    const dates = [];
    console.log('Hay ' + asistencias.length + ' dias con registros');

    for (let i = 0; i < asistencias.length; i++) {
        console.log('Registro #' + (i + 1) + ' de #' + asistencias.length);

        await page.waitForSelector('.imc-com-todas-contenedor');
        await asistencias[i].click();
        await page.waitForSelector('.imc-av-detalle');

        const asignaturas = await page.evaluate(() => {
            const horas = document.querySelectorAll('.imc-av-detalle li ul li:first-of-type .imc-dato strong');
            const asignaturas_array = [];

            for (let j = 0; j < horas.length; j++) {
                asignaturas_array.push(horas[j].innerText);
            }

            return asignaturas_array;
        });
        console.log(asignaturas);


        // Guardar repeticiones de asignaturas
        for (let j = 0; j < asignaturas.length; j++) {
            let encontrado = false;

            for (let k = 0; k < listaAsignaturas.length; k++) {
                if (listaAsignaturas[k].asignatura == asignaturas[j]) {
                    listaAsignaturas[k].repeticiones++;
                    encontrado = true;
                    break;
                }
            }

            if (!encontrado) {
                listaAsignaturas.push({
                    asignatura: asignaturas[j],
                    repeticiones: 1
                });
            }
        }


        await page.click('.bt.bt-volver-listado');
    }

    await browser.close();


    console.log('\n    Faltas por asignatura:');
    console.log('-------------------------------');
    for (let i = 0; i < listaAsignaturas.length; i++) {
        console.log(listaAsignaturas[i].asignatura + ': ' + listaAsignaturas[i].repeticiones);
    }
    console.log('-------------------------------\n');
})();