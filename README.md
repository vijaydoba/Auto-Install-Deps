# Auto Install Deps

**Auto Install Deps** is a Visual Studio Code extension that helps you **detect missing dependencies** in your code and **install them with one click**.

It scans your open files, tries to detect which packages you are using, and offers a **Quick Fix** to run the correct install command in the terminal.

> ⚠️ Important:  
> This extension is **best** for Node.js (npm/yarn/pnpm).  
> Other languages are **basic / experimental helpers** and may not always be accurate.

---

## ✨ Features

- 🔍 Scan your code for imports / requires / uses
- ⚠️ Show warnings for **likely missing dependencies**
- 💡 Quick Fix: **“Install dependency <name>”**
- 🧰 Automatically picks the right install command per language:
  - Node.js → `npm install` / `yarn add` / `pnpm add`
  - Python → `pip install`
  - Java → `mvn dependency:get`
  - C# → `dotnet add package`
  - PHP → `composer require`
  - Go → `go get`
  - Rust → `cargo add`
  - Ruby → `bundle add`
  - Dart → `dart pub add`

---

## ✅ Supported languages (current version)

| Language | VS Code ID(s)                   | Package Manager / Command                         | Status       |
|---------|----------------------------------|---------------------------------------------------|-------------|
| Node.js / JS / TS | `javascript`, `javascriptreact`, `typescript`, `typescriptreact` | `npm / yarn / pnpm` | **Main / stable** |
| Python  | `python`                         | `pip install <module>`                            | Experimental |
| Java    | `java`                           | `mvn dependency:get -Dartifact=<group:artifact>`  | Experimental |
| C# / .NET | `csharp`                       | `dotnet add package <name>`                       | Experimental |
| PHP     | `php`                            | `composer require <vendor/package>`               | Experimental |
| Go      | `go`                             | `go get <module>`                                 | Experimental |
| Rust    | `rust`                           | `cargo add <crate>`                               | Experimental |
| Ruby    | `ruby`                           | `bundle add <gem>`                                | Experimental |
| Dart    | `dart`                           | `dart pub add <package>`                          | Experimental |

> “Experimental” = simple heuristics. The extension **does not truly know** your full build setup.  
> Always double-check before confirming the install.

---

## 🧩 How it works (in simple words)

### 1. Node / JavaScript / TypeScript

- Looks for:
  ```ts
  import express from "express";
  const _ = require("lodash");
  ```
- Ignores:
  - Relative imports like `./utils`, `../components/Button`
  - Built-in Node modules like `fs`, `path`, `http`, etc.
- Checks if the dependency exists in:
  - `node_modules/<name>`
- If not found:
  - Shows a warning under the import
  - Offers **“Install dependency 'express'”**
  - Runs:
    - `yarn add express` (if `yarn.lock` exists), or
    - `pnpm add express` (if `pnpm-lock.yaml` exists), or
    - `npm install express` (default)

This is the **most reliable** part of the extension.

---

### 2. Python

- Looks for:
  ```py
  import requests
  from numpy import array
  ```
- Extracts the module name (`requests`, `numpy`)  
- It **does not check** if the module is actually installed.  
- Always shows a warning like:
  > Python dependency "requests" may not be installed (pip).
- Quick Fix runs:
  ```bash
  pip install requests
  ```

Use it as a helper, not as a strict check.

---

### 3. Java

- Looks for:
  ```java
  import org.slf4j.Logger;
  ```
- Skips standard packages (`java.*`, `javax.*`, `jakarta.*`)
- Guesses a Maven artifact:
  - `org.slf4j.Logger` → `org.slf4j:Logger:LATEST` (very rough)
- Shows a warning:
  > Java dependency "org.slf4j:Logger:LATEST" may not be available (Maven).
- Quick Fix runs:
  ```bash
  mvn dependency:get -Dartifact=org.slf4j:Logger:LATEST
  ```

This is **only a suggestion**, not a precise Maven mapping.

---

### 4. C# / .NET

- Looks for:
  ```csharp
  using MyCompany.MyLibrary;
  ```
- Skips `System.*` and `Microsoft.*`
- Guesses package name from the first part:
  - `MyCompany.MyLibrary` → `MyCompany`
- Quick Fix runs:
  ```bash
  dotnet add package MyCompany
  ```

Very rough. Real .NET projects usually need correct package names in `.csproj`.

---

### 5. PHP

- Looks for:
  ```php
  use Vendor\Package\Something;
  ```
- Guesses Composer package:
  - `Vendor\Package\Something` → `vendor/package`
- Quick Fix runs:
  ```bash
  composer require vendor/package
  ```

Again, only a heuristic.

---

### 6. Go

- Looks for:
  ```go
  import "github.com/user/repo"
  ```
  or
  ```go
  import (
      "fmt"
      "github.com/user/repo"
  )
  ```
- For each non-standard import, shows a warning and offers:
  ```bash
  go get github.com/user/repo
  ```

---

### 7. Rust

- Looks for:
  ```rust
  extern crate serde;
  use serde::Serialize;
  ```
- Skips `std`, `core`, `alloc`, etc.
- For root crate names like `serde`, suggests:
  ```bash
  cargo add serde
  ```

---

### 8. Ruby

- Looks for:
  ```rb
  require "rails"
  ```
- Suggests:
  ```bash
  bundle add rails
  ```

---

### 9. Dart

- Looks for:
  ```dart
  import 'package:http/http.dart';
  ```
- Extracts `http` and suggests:
  ```bash
  dart pub add http
  ```

---

## 🚀 Usage

1. Open your project folder in VS Code.
2. Open a source file (JS, TS, PY, JAVA, etc.).
3. Write or open code that imports/uses a dependency:
   - JS:
     ```ts
     import express from "express";
     ```
   - Python:
     ```py
     import requests
     ```
   - C#:
     ```csharp
     using MyCompany.MyLibrary;
     ```
4. If the extension thinks the dependency is missing:
   - You’ll see a **yellow warning underline**.
   - Click the **💡 lightbulb** icon or press:
     - `Ctrl + .` (Windows / Linux)
     - `Cmd + .` (macOS)
5. Choose:
   > **Install dependency "xxx"**
6. A new terminal opens with the install command already entered and executed.

---

## 🧩 Commands

The extension contributes one command (used behind the scenes):

- **Auto Install Deps: Install Dependency**

Normally, you don’t need to run it manually.  
You use it via Quick Fix / lightbulb.

---

## 🔧 Requirements

- Visual Studio Code version compatible with the `engines.vscode` in `package.json`
- For each language you use, you should have the corresponding tools installed:
  - Node.js + npm/yarn/pnpm
  - Python + pip
  - Java + Maven (`mvn`)
  - .NET SDK (`dotnet`)
  - PHP + Composer
  - Go
  - Rust + Cargo
  - Ruby + Bundler
  - Dart SDK

If the tool is missing, the terminal command may fail.

---

## ⚠️ Limitations

- For **Node.js**, the extension checks `node_modules` and is more reliable.
- For other languages:
  - The extension does **not** really parse project files (`pom.xml`, `csproj`, `go.mod`, `Cargo.toml`, etc.).
  - It **does not truly know** if a package is installed or already referenced.
  - It only makes **educated guesses** from your imports/usings.
- Always review the suggested command before running it.

Think of this extension as a **helper**, not a full dependency manager.

---

## 🗺️ Roadmap / Ideas

Future improvements (ideas):

- Smarter detection using project files (`package.json`, `pyproject.toml`, `pom.xml`, `csproj`, etc.)
- Add settings to:
  - enable/disable languages
  - change default install commands
- Better mapping for Java / .NET dependencies
- Show unused dependencies (especially for Node.js)

---

## 🧑‍💻 Contributing

1. Fork the repo:  
   `https://github.com/vijaydoba/Auto-Install-Deps`
2. Clone and install:
   ```bash
   git clone https://github.com/vijaydoba/Auto-Install-Deps.git
   cd Auto-Install-Deps
   npm install
   npm run compile
   ```
3. Open in VS Code and press **F5** to launch the extension in a new window.
4. Make changes, test, and open a Pull Request.

---

## 📄 License

MIT License – feel free to use, modify, and contribute.

---

Enjoy coding with fewer “install this package” interruptions 🚀  
If you find this useful, a ⭐ on GitHub or a review on the Marketplace helps a lot!
