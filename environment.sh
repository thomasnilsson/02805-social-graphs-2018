# Install iPython environment for python 2
https://ipython.readthedocs.io/en/latest/install/kernel_install.html

# All environments
conda info --envs

# create Python 2.7 env
conda create -n py27 python=2.7 anaconda

# Switch to python 2.7
source activate py27

# Switch back to python 3 (mine is called base)
source activate base