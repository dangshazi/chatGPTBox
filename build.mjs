import archiver from 'archiver'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import fs from 'fs-extra'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import webpack from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

const outdir = 'build'

const __dirname = path.resolve()
const isProduction = process.argv[2] !== '--development' // --production and --analyze are both production
const isAnalyzing = process.argv[2] === '--analyze'

/**
 * Deletes the old builded files in output directory.
 *
 */
async function deleteOldDir() {
  await fs.rm(outdir, { recursive: true, force: true })
}

/**
 * generates the webpack config
 * @param {*} isWithoutKatex
 * @param {*} isWithoutTiktoken
 * @param {*} minimal
 * @param {*} callback
 */
async function runWebpack(isWithoutKatex, isWithoutTiktoken, minimal, callback) {
  const shared = [
    'preact',
    'webextension-polyfill',
    '@primer/octicons-react',
    'react-bootstrap-icons',
    'countries-list',
    'i18next',
    'react-i18next',
    'react-tabs',
    './src/utils',
    './src/_locales/i18n-react',
  ]
  if (isWithoutKatex) shared.push('./src/components')

  const compiler = webpack({
    entry: {
      'content-script': {
        import: './src/content-script/index.jsx',
        dependOn: 'shared',
      },
      background: {
        import: './src/background/index.mjs',
      },
      popup: {
        import: './src/popup/index.jsx',
        dependOn: 'shared',
      },
      options: {
        import: './src/options/index.jsx',
        dependOn: 'shared',
      },
      IndependentPanel: {
        import: './src/pages/IndependentPanel/index.jsx',
        dependOn: 'shared',
      },
      chatpage: {
        import: './src/chatpage/index.jsx',
        dependOn: 'shared',
      },
      shared: shared,
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, outdir),
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            output: { ascii_only: true },
          },
        }),
        new CssMinimizerPlugin(),
      ],
      concatenateModules: !isAnalyzing,
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public/icons',
            to: 'icons',
          },
          {
            from: 'public/favicon',
            to: 'favicon',
          },
          // {
          //   from: 'public/fonts',
          //   to: 'fonts',
          // },
          {
            from: 'public/logo',
            to: 'logo',
          },
        ],
      }),
      minimal
        ? undefined
        : new webpack.ProvidePlugin({
            process: 'process/browser.js',
            Buffer: ['buffer', 'Buffer'],
          }),
      new ProgressBarPlugin({
        format: '  build [:bar] :percent (:elapsed seconds)',
        clear: false,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: isAnalyzing ? 'static' : 'disable',
      }),
      ...(isWithoutKatex
        ? [
            new webpack.NormalModuleReplacementPlugin(/markdown\.jsx/, (result) => {
              if (result.request) {
                result.request = result.request.replace(
                  'markdown.jsx',
                  'markdown-without-katex.jsx',
                )
              }
            }),
          ]
        : []),
    ],
    resolve: {
      extensions: ['.jsx', '.mjs', '.js'],
      alias: {
        parse5: path.resolve(__dirname, 'node_modules/parse5'),
        ...(minimal
          ? {}
          : {
              util: path.resolve(__dirname, 'node_modules/util'),
              buffer: path.resolve(__dirname, 'node_modules/buffer'),
              stream: 'stream-browserify',
              crypto: 'crypto-browserify',
            }),
      },
    },
    module: {
      rules: [
        {
          test: /\.m?jsx?$/,
          exclude: /(node_modules)/,
          resolve: {
            fullySpecified: false,
          },
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  '@babel/preset-env',
                  {
                    plugins: ['@babel/plugin-transform-runtime'],
                  },
                ],
                plugins: [
                  [
                    '@babel/plugin-transform-react-jsx',
                    {
                      runtime: 'automatic',
                      importSource: 'preact',
                    },
                  ],
                ],
              },
            },
          ],
        },
        {
          test: /\.s[ac]ss$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'sass-loader',
            },
          ],
        },
        {
          test: /\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'less-loader',
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
            },
          ],
        },
        {
          test: /\.(woff|ttf)$/,
          type: 'asset/resource',
          generator: {
            emit: false,
          },
        },
        {
          test: /\.woff2$/,
          type: 'asset/inline',
        },
        {
          test: /\.(jpg|png|svg)$/,
          type: 'asset/inline',
        },
        {
          test: /\.(graphql|gql)$/,
          loader: 'graphql-tag/loader',
        },
        isWithoutTiktoken
          ? {
              test: /crop-text\.mjs$/,
              loader: 'string-replace-loader',
              options: {
                multiple: [
                  {
                    search: "import { encode } from '@nem035/gpt-3-encoder'",
                    replace: '',
                  },
                  {
                    search: 'encode(',
                    replace: 'String(',
                  },
                ],
              },
            }
          : {},
        minimal
          ? {
              test: /styles\.scss$/,
              loader: 'string-replace-loader',
              options: {
                multiple: [
                  {
                    search: "@import '../fonts/styles.css';",
                    replace: '',
                  },
                ],
              },
            }
          : {},
        minimal
          ? {
              test: /index\.mjs$/,
              loader: 'string-replace-loader',
              options: {
                multiple: [
                  {
                    search: 'import { generateAnswersWithChatGLMApi }',
                    replace: '//',
                  },
                  {
                    search: 'await generateAnswersWithChatGLMApi',
                    replace: '//',
                  },
                  {
                    search: 'chatglmTurbo',
                    replace: '//',
                  },
                  {
                    search: "'chatglmTurbo",
                    replace: '//',
                  },
                ],
              },
            }
          : {},
      ],
    },
  })
  if (isProduction) compiler.run(callback)
  else compiler.watch({}, callback)
}

async function zipFolder(dir) {
  const output = fs.createWriteStream(`${dir}.zip`)
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })
  archive.pipe(output)
  archive.directory(dir, false)
  await archive.finalize()
}

async function copyFiles(entryPoints, targetDir) {
  if (!fs.existsSync(targetDir)) await fs.mkdir(targetDir)
  await Promise.all(
    entryPoints.map(async (entryPoint) => {
      await fs.copy(entryPoint.src, `${targetDir}/${entryPoint.dst}`)
    }),
  )
}

/**
 * Generate the necessary output files for both Chromium and Firefox browsers based on the common files.
 *
 * @param {string} outputDirSuffix - the suffix to be added to the output directory
 * @return {Promise<void>} a Promise that resolves when the output files are generated
 */
async function finishOutput(outputDirSuffix) {
  // list all files in build folder
  const buildDirectory = 'build'
  const filesInBuildDir = await fs.readdir(buildDirectory, { recursive: false }).then((files) =>
    files.filter((file) => {
      // return !fs.statSync(path.join(buildDirectory, file)).isDirectory()
      // file name is not chromium or firefox
      return !file.includes('chromium') && !file.includes('firefox')
    }),
  )
  // parse filesInBuildDir into array of objects which contains src and dst
  const buildedFiles = filesInBuildDir.map((file) => ({ src: `build/${file}`, dst: file }))

  const commonFiles = [
    ...buildedFiles,
    { src: 'src/logo.png', dst: 'logo.png' },
    { src: 'src/rules.json', dst: 'rules.json' },
    { src: 'src/popup/index.html', dst: 'popup.html' },
    { src: 'src/options/index.html', dst: 'options.html' },
    { src: 'src/pages/IndependentPanel/index.html', dst: 'IndependentPanel.html' },
    { src: 'src/chatpage/index.html', dst: 'chatpage.html' },
    // { src: 'public/favicon', dst: 'favicon' },
    // { src: 'public/icons', dst: 'icons' },
    // { src: 'public/logo', dst: 'logo' },
  ]

  // chromium
  const chromiumOutputDir = `./${outdir}/chromium${outputDirSuffix}`
  await copyFiles(
    [
      ...commonFiles,
      { src: 'src/fonts', dst: 'fonts' },
      { src: 'src/manifest.json', dst: 'manifest.json' },
    ],
    chromiumOutputDir,
  )
  if (isProduction) await zipFolder(chromiumOutputDir)

  // firefox
  const firefoxOutputDir = `./${outdir}/firefox${outputDirSuffix}`
  await copyFiles(
    [...commonFiles, { src: 'src/manifest.v2.json', dst: 'manifest.json' }],
    firefoxOutputDir,
  )
  if (isProduction) await zipFolder(firefoxOutputDir)
}

/**
 * Generates a webpack callback function that handles errors and stats, then awaits the finishOutputFunc.
 *
 * @param {Function} finishOutputFunc - The function to call after handling errors and stats.
 * @return {Function} The webpack callback function.
 */
function generateWebpackCallback(finishOutputFunc) {
  return async function webpackCallback(err, stats) {
    if (err || stats.hasErrors()) {
      console.error(err || stats.toString())
      return
    }
    // console.log(stats.toString())

    await finishOutputFunc()
  }
}

async function build() {
  await deleteOldDir()
  if (isProduction && !isAnalyzing) {
    // await runWebpack(
    //   true,
    //   false,
    //   generateWebpackCallback(() => finishOutput('-without-katex')),
    // )
    // await new Promise((r) => setTimeout(r, 5000))
    // 1. runWebpack进行编译
    // 2. generateWebpackCallback用于讲编译好的代码打包成插件文件
    await runWebpack(
      true,
      true,
      true,
      generateWebpackCallback(() => finishOutput('-without-katex-and-tiktoken')),
    )
    await new Promise((r) => setTimeout(r, 10000))
  }
  await runWebpack(
    false,
    false,
    false,
    generateWebpackCallback(() => finishOutput('')),
  )
}

build()
