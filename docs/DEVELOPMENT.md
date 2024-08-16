# Development

## Stack

- Frontend : Angular
- Backend : Python
- Storage system : FS + SQlite

## Develop

Angular code is compiled by CI toolchain for deployment, 
to build the code in development mode, set WASCII_DEBUG config key to true, 
this will force Python to fetch its sources to the default compile folder of Angular (`ng build` result).

### External components :

- [Monaco editor](https://microsoft.github.io/monaco-editor/)([NGX translation](https://www.npmjs.com/package/ngx-monaco-editor-v2))
- [Asciidoctor](https://asciidoctor.org/)

### Branching model

We are using a classical branching model :
![git_diagram.drawio.svg](images/git_diagram.drawio.svg)

Few details :
- Release branches will be deleted when release is considered done (after validation period)

## How to collaborate

Fork the project, or ask to be added as collaborator, then create a pull request 
on the development branch (preferred), or on a release branch if you are working on a specific version.