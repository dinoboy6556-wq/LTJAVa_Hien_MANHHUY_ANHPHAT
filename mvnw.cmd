@echo off
setlocal
pushd "%~dp0library" || exit /b 1
call mvnw.cmd %*
set "MVNW_EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %MVNW_EXIT_CODE%
