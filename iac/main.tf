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

variable "dd_api_key" {
  description = "Datadog API Key"
  type        = string
  # sensitive   = true
}

variable "dd_site" {
  description = "Datadog Site"
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
      "docker compose logs --tail=20", # Show recent logs
    ]
  }

  
  provisioner "remote-exec" {
    inline = [      
      "export DD_API_KEY=${var.dd_api_key}",
      "export DD_SITE=${var.dd_site}",
      "bash -c \"$(curl -L https://install.datadoghq.com/scripts/install_script_agent7.sh)\"",

      # Configure Datadog agent
      "mkdir -p /etc/datadog-agent/conf.d/docker.d",
      "echo 'init_config:' > /etc/datadog-agent/conf.d/docker.d/conf.yaml",
      "echo 'instances:' >> /etc/datadog-agent/conf.d/docker.d/conf.yaml",
      "echo '  - url: \"unix://var/run/docker.sock\"' >> /etc/datadog-agent/conf.d/docker.d/conf.yaml",
      "echo '    collect_container_size: true' >> /etc/datadog-agent/conf.d/docker.d/conf.yaml",
      "echo '    collect_image_size: true' >> /etc/datadog-agent/conf.d/docker.d/conf.yaml",
      "echo '    collect_images_stats: true' >> /etc/datadog-agent/conf.d/docker.d/conf.yaml",

      # Give Datadog agent access to Docker socket
      "usermod -a -G docker dd-agent",

      # Enable Docker integration in main Datadog config
      "echo 'docker_enabled: true' >> /etc/datadog-agent/datadog.yaml",

      # Enable log collection and collect all container logs
      "echo 'logs_enabled: true' >> /etc/datadog-agent/datadog.yaml",
      "echo 'logs_config:' >> /etc/datadog-agent/datadog.yaml",
      "echo '  container_collect_all: true' >> /etc/datadog-agent/datadog.yaml",

  
      # Restart Datadog agent
      "systemctl restart datadog-agent",
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
    protocol         = "udp"
    port_range       = "123"
    source_addresses = ["0.0.0.0/0"]
  }
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
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
