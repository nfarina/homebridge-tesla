from tesla_powerwall import Powerwall

# Create a simple powerwall object by providing the IP
powerwall = Powerwall("192.168.91.1")
#=> <Powerwall ...>

powerwall.login("FTXMT", "nfarina@gmail.com")

print(powerwall.get_capacity())
print(powerwall.get_meters())