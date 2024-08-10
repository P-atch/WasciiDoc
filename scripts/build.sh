RED="\e[31m"
GREEN="\e[32m"
RESET="\e[0m"

cd angular
npm i
ng build
echo -e "${GREEN}Successfully built app${RESET}"
cd ..
cp -rv angular/dist/wascii-doc/browser src/browser
echo -e "${GREEN}Ng resources copied from angular to src/${RESET}"