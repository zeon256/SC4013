variable "ssh_key" {
  description = "SSH key fingerprint"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  default     = "sgp1"
  type        = string
}

variable "do_token" {
  description = "DigitalOcean Token For Deploy"
  type        = string
  # sensitive   = true
}

variable "do_registry_token" {
  description = "DigitalOcean Registry Token"
  type        = string
  # sensitive   = true
}

# main.tf
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# Create a new droplet
resource "digitalocean_droplet" "sc4013-stg" {
  image    = "docker-20-04"
  name     = "sc4013-stg"
  region   = var.region
  size     = "s-1vcpu-2gb"
  ssh_keys = [var.ssh_key]
  connection {
    type        = "ssh"
    user        = "root"
    private_key = file("./digitalocean_deploy")
    host        = self.ipv4_address
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir /app",
      "mkdir /app/iac",
      "mkdir /app/config",
      "mkdir /app/db_schema"
    ]
  }
  
  # Copy configuration files
  provisioner "file" {
    source      = "../.env"
    destination = "/app/.env"
  }

  provisioner "file" {
    source      = "../config.json"
    destination = "/app/config.json"
  }

  provisioner "file" {
    source      = "docker-compose.yml"
    destination = "/app/iac/docker-compose.yml"
  }

  provisioner "file" {
    source      = "../db_schema/v1_init.sql"
    destination = "/app/db_schema/v1_init.sql"
  }

  # run docker-compose
  provisioner "remote-exec" {
    inline = [
      "cd /app/iac",
      "docker login registry.digitalocean.com -u ${var.do_registry_token} -p ${var.do_registry_token}", # setup registry keys
      "docker compose up -d",
      "docker compose ps",
      "sleep 10", # Wait for containers to start
      "docker compose logs --tail=20" # Show recent logs
    ]
  }
}
# Create a firewall
resource "digitalocean_firewall" "sc4013-firewall" {
  name = "sc4013-firewall"
  droplet_ids = [digitalocean_droplet.sc4013-stg.id]
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0"]
  }
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0"]
  }
  inbound_rule {
    protocol         = "tcp"
    port_range       = "3000"
    source_addresses = ["0.0.0.0/0"]
  }
  outbound_rule {
    protocol              = "tcp"
    port_range           = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }
}
# Output the droplet IP
output "droplet_ip" {
  value = digitalocean_droplet.sc4013-stg.ipv4_address
}
