var { test, expect } = require('@playwright/test');

async function autenticar(page) {
  await page.goto('/');
  await page.locator('#login-google').click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.locator('#nombre')).toHaveValue('Ana Segura');
  await expect(page.locator('#m')).toBeEnabled();
}

async function enviar(page, mensaje) {
  await page.locator('#m').fill(mensaje);
  await page.getByRole('button', { name: 'Send' }).click();
}

test.describe('acceso social local', function () {
  test('muestra una pagina previa al login', async function ({ page }) {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'UNA Chat' })).toBeVisible();
    await expect(page.locator('#login-google')).toHaveText('Continuar con Google');
    await expect(page.locator('#messages')).toHaveCount(0);
  });

  test('el acceso directo requiere autenticacion', async function ({ page }) {
    await page.goto('/chat');

    await expect(page).toHaveURL(/login_required=1/);
    await expect(page.locator('#auth-message')).toContainText('Debes iniciar sesión');
  });

  test('un error permite reintentar sin mostrar detalles', async function ({ page }) {
    await page.goto('/callback?error=access_denied&error_description=detalle-secreto');

    await expect(page).toHaveURL(/auth_error=1/);
    await expect(page.locator('#auth-message')).toContainText('Puedes intentarlo de nuevo');
    await expect(page.locator('body')).not.toContainText('detalle-secreto');
    await expect(page.locator('#login-google')).toBeVisible();
  });

  test('muestra la identidad autenticada como solo lectura', async function ({ page }) {
    await autenticar(page);

    await expect(page.locator('#identity-name')).toHaveText('Ana Segura');
    await expect(page.locator('#nombre')).toHaveAttribute('readonly', '');
    await expect(page.locator('#logout')).toHaveText('Cerrar sesión');
  });

  test('logout vuelve a exigir autenticacion', async function ({ page }) {
    await autenticar(page);
    await page.locator('#logout').click();

    await expect(page).toHaveURL(/\/$/);
    await page.goto('/chat');
    await expect(page).toHaveURL(/login_required=1/);
  });
});

test.describe('chat autenticado', function () {
  test.beforeEach(async function ({ page }) {
    await autenticar(page);
  });

  test.afterEach(async function ({ page }) {
    await page.waitForTimeout(300);
  });

  test('muestra la imagen con identidad autenticada', async function ({ page }) {
    await enviar(page, 'http://image.com/image.jpg');

    var img = page.locator('#messages img');
    await expect(img).toHaveCount(1);
    await expect(img).toHaveAttribute('src', 'http://image.com/image.jpg');
    await expect(page.locator('#messages')).toContainText('Ana Segura');
    await expect(page.locator('#m')).toHaveValue('');
  });

  test('inserta un reproductor de YouTube', async function ({ page }) {
    await enviar(page, 'https://www.youtube.com/watch?v=qYwlqx-JLok');

    var frame = page.locator('#messages iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', /youtube\.com\/embed\/qYwlqx-JLok/);
  });

  test('inserta un reproductor para un archivo de video', async function ({ page }) {
    await enviar(page, 'https://cdn.example.com/clip.mp4');

    var video = page.locator('#messages video');
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute('src', 'https://cdn.example.com/clip.mp4');
    await expect(video).toHaveAttribute('controls', '');
  });

  test('deja el texto plano como texto', async function ({ page }) {
    await enviar(page, 'hola equipo');

    var item = page.locator('#messages li');
    await expect(item).toContainText('Ana Segura: hola equipo');
    await expect(page.locator('#messages img, #messages iframe, #messages video')).toHaveCount(0);
  });

  test('no permite falsificar el nombre desde el navegador', async function ({ page }) {
    await page.locator('#nombre').evaluate(function (input) {
      input.removeAttribute('readonly');
      input.value = 'Administrador falso';
    });
    await enviar(page, 'mensaje seguro');

    await expect(page.locator('#messages li')).toContainText('Ana Segura: mensaje seguro');
    await expect(page.locator('#messages li')).not.toContainText('Administrador falso');
  });

  test('no convierte una URL de imagen dentro de una frase', async function ({ page }) {
    await enviar(page, 'mira http://image.com/image.jpg');

    await expect(page.locator('#messages li')).toContainText('mira http://image.com/image.jpg');
    await expect(page.locator('#messages img')).toHaveCount(0);
  });

  test('no muestra una inyeccion de script', async function ({ page }) {
    await enviar(page, '<script>alert("xss")</script>');

    await expect(page.locator('#messages li')).toContainText('Ana Segura:');
    await expect(page.locator('#messages script')).toHaveCount(0);
    await expect(page.locator('#messages img, #messages iframe, #messages video')).toHaveCount(0);
  });

  test('escapa HTML ordinario', async function ({ page }) {
    await enviar(page, '<b>texto</b>');

    await expect(page.locator('#messages li')).toContainText('Ana Segura: <b>texto</b>');
    await expect(page.locator('#messages li b')).toHaveCount(1);
  });

  test('muestra el encabezado y el aviso de URL', async function ({ page }) {
    await expect(page.getByRole('heading', { name: 'Chat UNA' })).toBeVisible();
    await expect(page.locator('#aviso')).toContainText('URL de imagen o de video');
    await expect(page.locator('#m')).toHaveAttribute('placeholder', /pegue una URL/);
  });

  test('no publica un mensaje vacio o de solo espacios', async function ({ page }) {
    await page.locator('#m').fill('   ');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('#messages li')).toHaveCount(0);
    await expect(page.locator('#m')).toHaveValue('   ');
  });

  test('la imagen cabe en el ancho de la lista', async function ({ page }) {
    await page.setViewportSize({ width: 360, height: 700 });
    await enviar(page, 'http://image.com/image.jpg');

    var img = page.locator('#messages img');
    await expect(img).toHaveCount(1);
    var cabe = await img.evaluate(function (element) {
      var list = document.getElementById('messages');
      return element.getBoundingClientRect().width <= list.clientWidth + 1;
    });
    expect(cabe).toBe(true);
  });
});
