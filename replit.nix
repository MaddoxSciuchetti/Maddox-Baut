{
  description = "Node.js environment";
  
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server
  ];
} 