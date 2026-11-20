@echo off
rem Build and start the desktop game. Needs only a JDK (17+) on PATH.
cd /d "%~dp0"
if exist build\game rmdir /s /q build\game
mkdir build\game
dir /s /b core\src\main\*.java desktop\src\*.java > build\sources.txt
javac -d build\game @build\sources.txt || exit /b 1
java -cp build\game com.krinkerlabs.pinball.desktop.Main %*
