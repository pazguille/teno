import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { render } from "preact-render-to-string";

function App() {
  return (
    <html lang="es-AR">
      <head>
        <meta charset="utf-8" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
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
            display: flex;
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
            min-width: calc(100vw - 30px);
            scroll-snap-align: start;
            overscroll-behavior-y: contain;
          }

          textarea {
            border: none;
            outline: none;
          }

          @media(min-width: 54em) {
            main {
              padding: 10px 15px;
              height: calc(100vh - 140px);
            }

            textarea,
            output {
              width: 50%;
              min-width: auto;
              border-radius: 10px;
            }
          }
        `}</style>
      </head>
      <body>
        <header>
          <h1>Teno</h1>
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
          import { CSS } from 'https://cdn.deno.land/gfm/versions/0.1.22/raw/style.js';
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
