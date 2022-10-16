import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import { render } from "preact-render-to-string";

function App() {
  return (
    <html lang="es-AR">
      <head>
        <meta charset="utf-8" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Teno" />
        <meta name="theme-color" content="#0d1117" />
        <title>Teno</title>
        <script type="module" src="https://md-block.verou.me/md-block.js"></script>
        <style>{`
          :root {
            color-scheme: dark;
          }

          body {
            margin: 0;
          }

          header {
            height: 40px;
            padding: 10px;
          }

          header h1 {
            margin: 0;
          }

          main {
            display: grid;
            grid-template-columns: 100vw 100vw;
            align-content: start;
            height: calc(100vh - 120px);
            overflow-x: scroll;
            overflow-y: hidden;
            overscroll-behavior-x: contain;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
          }

          menu {
            display: flex;
            align-items: center;
            gap: 10px;
            height: 40px;
            padding: 10px;
            margin: 0;
            list-style: none;
          }

          textarea,
          output {
            padding: 15px;
            overflow: auto;
            scroll-snap-align: start;
            overscroll-behavior-y: contain;s
            min-width: 100vw;
            min-height: 100vh;
          }

          textarea {
            border: none;
            outline: none;
            font-size: 16px;
          }

          @media(min-width: 54em) {
            main {
              padding: 10px 15px;
              height: calc(100vh - 140px);
              grid-template-columns: 1fr 1fr;
            }

            textarea,
            output {
              min-width: auto;
              border-radius: 10px;
            }
          }
        `}</style>
      </head>
      <body>
        <header>
          <h1>Teno <small>📝 🦕</small></h1>
        </header>

        <main>
          <textarea autofocus></textarea>
          <output
            class="markdown-body"
            data-color-mode="dark"
            data-dark-theme="dark"
            data-light-theme="light"
          >
            <md-block rendered="content" class="highlight"></md-block>
          </output>
        </main>

        <menu>
          <li>
            <button id="open">Abrir</button>
          </li>
          <li>
            <button id="save">Guardar</button>
          </li>
          {/* <li>
            <button id="copy">Copiar</button>
          </li> */}
          <li>
            <button id="del">Borrar</button>
          </li>
        </menu>

        <script src="https://unpkg.com/prismjs@1.28.0/prism.js"></script>
        <script type="module">{`
          window.requestIdleCallback = window.requestIdleCallback || function (cb) {
            var start = Date.now();
            return setTimeout(function () {
              cb({
                didTimeout: false,
                timeRemaining: function () {
                  return Math.max(0, 50 - (Date.now() - start));
                }
              });
            }, 1);
          };

          import { CSS } from 'https://cdn.deno.land/gfm/versions/0.1.26/raw/style.js';
          document.querySelector('style').insertAdjacentText('beforeend', CSS);

          const ta = document.querySelector('textarea');
          const md = document.querySelector('md-block');
          ta.addEventListener('input', () => md.mdContent = ta.value);

          const n = localStorage.getItem('note', ta.value);
          md.mdContent = ta.value = n;

          setInterval(() => {
            requestIdleCallback(() => {
              localStorage.setItem('note', ta.value);
            });
          }, 1000);


          let db = null;
          const iddb = window.indexedDB.open('files', 1);
          iddb.onupgradeneeded = eve => {
            eve.currentTarget.result
              .createObjectStore(
                'files', { keyPath: 'name', autoIncrement: true }
              )
              .createIndex('name', 'name', { unique: true });
          };
          iddb.onsuccess = eve => {
            db = eve.target.result;

            db
              .transaction('files', 'readonly')
              .objectStore('files')
              .getAll()
              .onsuccess = async (eve) => {
                const files = eve.target.result;
                if (files.length) {
                  fileHandle = files[0].file;
                }
              };
          };

          let fileHandle = null;

          async function writeFile(file, contents) {
            const writable = await file.createWritable();
            await writable.write(contents);
            await writable.close();
          }

          document.querySelector('#open').addEventListener('click', async () => {
            const files = await window.showOpenFilePicker();
            fileHandle = files[0];
            const file = await fileHandle.getFile();
            const contents = await file.text();
            md.mdContent = ta.value = contents;

            await fileHandle.requestPermission({ mode: 'readwrite' })

            db
              .transaction('files', 'readwrite')
              .objectStore('files')
              .add({
                name: fileHandle.name,
                file: fileHandle,
              });

          });

          document.querySelector('#save').addEventListener('click', async () => {
            if (fileHandle) {
              await writeFile(fileHandle, ta.value);
              return;
            }

            fileHandle = await window.showSaveFilePicker({
              suggestedName: 'new-post.md',
              types: [
                {
                  accept: {
                    'text/markdown': ['.md'],
                  },
                },
              ],
            });

            await writeFile(fileHandle, ta.value);
          });

          // document.querySelector('#copy').addEventListener('click', () => {
          //   navigator.clipboard.writeText(ta.value);
          // });

          document.querySelector('#del').addEventListener('click', () => {
            md.mdContent = ta.value = '';
            requestIdleCallback(() => {
              localStorage.setItem('note', ta.value);
            });
            db
              .transaction('files', 'readwrite')
              .objectStore('files')
              .delete(fileHandle.name);
            fileHandle = null;
          });
          `}</script>
      </body>
    </html>
  );
}

function handler() {
  const html = render(<App />);
  return new Response(html, {
    headers: {
      "content-type": "text/html",
    },
  });
}

serve(handler, { port: 8080 });
