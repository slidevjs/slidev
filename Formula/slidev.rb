class Slidev < Formula
  desc "Presentation slides for developers"
  homepage "https://sli.dev"
  url "https://registry.npmjs.org/@slidev/cli/-/cli-52.10.0.tgz"
  sha256 "7882bc8212b3eff074f809f210ba02c092422edba596a343cebcd9febf56d145"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    system "npm", "install", "--prefix", libexec, "--production"
    bin.install_symlink libexec/"bin/slidev.mjs" => "slidev"
  end

  test do
    system "#{bin}/slidev", "--version"
  end
end