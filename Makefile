.PHONY: clean

all: firefox

firefox:
	web-ext build --source-dir=./src -a=./output --overwrite-dest

clean:
	rm -f ./output
