var { test, expect } = require('@playwright/test');

async function enviar(page, mensaje) {
  await page.locator('#nombre').fill('Ana');
  await page.locator('#m').fill(mensaje);
  await page.getByRole('button', { name: 'Send' }).click();
}

test.describe('chat con URLs en el navegador', function () {
  test.beforeEach(async function ({ page }) {
    await page.goto('/');
    await expect(page.locator('#m')).toBeVisible();
  });

  test.afterEach(async function ({ page }) {
    await page.waitForTimeout(1000);
  });

  test('muestra la imagen cuando el mensaje es una URL de imagen', async function ({ page }) {
    await enviar(page, 'http://image.com/image.jpg');

    var img = page.locator('#messages img');
    await expect(img).toHaveCount(1);
    await expect(img).toHaveAttribute('src', 'http://image.com/image.jpg');
    await expect(page.locator('#messages')).toContainText('Ana');
    await expect(page.locator('#m')).toHaveValue('');
  });

  test('inserta un reproductor de YouTube', async function ({ page }) {
    await enviar(page, 'https://www.youtube.com/watch?v=qYwlqx-JLok');

    var frame = page.locator('#messages iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', /youtube\.com\/embed\/qYwlqx-JLok/);
  });

  test('inserta un reproductor cuando el mensaje es un archivo de video', async function ({ page }) {
    await enviar(page, 'https://cdn.example.com/clip.mp4');

    var video = page.locator('#messages video');
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute('src', 'https://cdn.example.com/clip.mp4');
    await expect(video).toHaveAttribute('controls', '');
  });

  test('deja el texto plano como texto', async function ({ page }) {
    await enviar(page, 'hola equipo');

    var item = page.locator('#messages li');
    await expect(item).toContainText('Ana: hola equipo');
    await expect(page.locator('#messages img, #messages iframe, #messages video')).toHaveCount(0);

    var mensaje = await item.boundingBox();
    var formulario = await page.locator('form').boundingBox();
    expect(mensaje.y + mensaje.height).toBeLessThanOrEqual(formulario.y + 1);
  });

  test('no convierte una URL de imagen escrita dentro de una frase', async function ({ page }) {
    await enviar(page, 'mira http://image.com/image.jpg');

    await expect(page.locator('#messages li')).toContainText('mira http://image.com/image.jpg');
    await expect(page.locator('#messages img')).toHaveCount(0);
  });

  test('no muestra una inyeccion de script', async function ({ page }) {
    await enviar(page, '<script>alert("xss")</script>');

    await expect(page.locator('#messages li')).toContainText('Ana:');
    await expect(page.locator('#messages script')).toHaveCount(0);
    await expect(page.locator('#messages img, #messages iframe, #messages video')).toHaveCount(0);
  });

  test('muestra el encabezado y el aviso de URL', async function ({ page }) {
    await expect(page.getByRole('heading', { name: 'Chat UNA' })).toBeVisible();
    await expect(page.locator('#aviso')).toContainText('URL de imagen o de video');
    await expect(page.locator('#m')).toHaveAttribute('placeholder', /pegue una URL/);

    var lista = await page.locator('#messages').boundingBox();
    var formulario = await page.locator('form').boundingBox();
    expect(lista.y).toBeLessThan(formulario.y);
  });

  test('no publica un mensaje vacio', async function ({ page }) {
    await page.locator('#nombre').fill('Ana');
    await page.locator('#m').fill('');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(1000);

    await expect(page.locator('#messages li')).toHaveCount(0);
    await expect(page.locator('#m')).toHaveValue('');
  });

  test('no publica un mensaje de solo espacios', async function ({ page }) {
    await page.locator('#nombre').fill('Ana');
    await page.locator('#m').fill('   ');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(1000);

    await expect(page.locator('#messages li')).toHaveCount(0);
    await expect(page.locator('#m')).toHaveValue('   ');
  });

  test('publica como Anonimo cuando no hay nombre', async function ({ page }) {
    await page.locator('#nombre').fill('');
    await page.locator('#m').fill('hola');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.locator('#messages li')).toContainText('Anónimo: hola');
  });

  test('la imagen cabe en el ancho de la lista', async function ({ page }) {
    await page.setViewportSize({ width: 360, height: 700 });
    await enviar(page, 'http://image.com/image.jpg');

    var img = page.locator('#messages img');
    await expect(img).toHaveCount(1);
    var cabe = await img.evaluate(function (el) {
      var lista = document.getElementById('messages');
      var maxWidth = parseFloat(window.getComputedStyle(el).maxWidth);
      return maxWidth <= lista.clientWidth + 1;
    });
    expect(cabe).toBe(true);
  });
});
