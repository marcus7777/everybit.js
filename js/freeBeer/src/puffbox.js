/** @jsx React.DOM */

var PuffFancyBox = React.createClass({
    render: function() {
        var   puff = this.props.puff
        var  style = {}
        var  stats = this.props.stats
        var arrows = stats.arrows
        var  width = stats.width
        var height = stats.height
        var    top = stats.y
        var   left = stats.x + CONFIG.leftMargin
        var hidden = !this.props.view.showinfo
        
        // set up classes
        var classArray = ['block']
        if(this.props.extraClassy)
            classArray.push(this.props.extraClassy)
        if(this.props.view.cursor == puff.sig) {
            classArray.push('cursor')            
        }
        if(PuffData.getBonus(puff, 'envelope'))
            classArray.push('encrypted')
        
        if (this.props.view.flash) {
            classArray.push('flashPuff');
            update_puffworldprops({'view.flash': false});
        }
        var className = classArray.join(' ')
        
        var offset = 30
        if(arrows) {
            width  -= offset
            height -= offset
            top  += offset/2
            left += offset/2
        }

        var spacing = 3
        if(!arrows) {
            width  -= spacing
            height -= spacing
            top  += spacing
            left += spacing
        }
        
        if(stats)
            style = {position: 'absolute', width: width, height: height, left: left, top: top }
        return (
            <div className={className} id={puff.sig} key={puff.sig} style={style}>
                <PuffAuthor username={puff.username} hidden={hidden} />
                <PuffContent puff={puff} height={height} />
                <PuffBar puff={puff} hidden={hidden} />
            </div>
        );
    }
});


var PuffAuthor = React.createClass({
    handleClick: function() {
        var username = this.props.username;
        // TODO: consolidate with menu.js handleShowUserPuffs
        return events.pub('ui/show/by-user', { 'view.mode': 'list'
                                             , 'view.filters': puffworlddefaults.view.filters
                                             , 'view.query': puffworlddefaults.view.query
                                             , 'view.filters.users': [username]
                                             })
    },
    render: function() {
        var username = humanizeUsernames(this.props.username)
        var className = 'author' + (this.props.hidden ? ' hidden' : '')

        return (
            <div className={className}><a href="" onClick={this.handleClick}>{username}</a></div>
        );
    }
});

var PuffContent = React.createClass({
    handleClick: function() {
        var puff = this.props.puff
        showPuff(puff.sig)
    },
    render: function() {
        var puff = this.props.puff
        var rawPuffs = puffworldprops.raw.puffs || [];
        var puffcontent = '';
        if (rawPuffs.indexOf(puff.sig) == -1) {
            puffcontent = PuffForum.getProcessedPuffContent(puff);
        } else {
            puffcontent = puff.payload.content;
            puffcontent = puffcontent
                                     .replace(/&/g, "&amp;") // escape html
                                     .replace(/</g, "&lt;")
                                     .replace(/>/g, "&gt;")
                                     .replace(/"/g, "&quot;")
                                     .replace(/'/g, "&#039;")
                                     .replace(/(?:\r\n|\r|\n)/g, '<br />') // replace line break with <br /> tag;

        }
        // FIXME: this is bad and stupid because user content becomes unescaped html don't do this really seriously
        return <div style={{height: this.props.height}} className="txt" onClick={this.handleClick} dangerouslySetInnerHTML={{__html: puffcontent}}></div>
    }
});

var PuffBar = React.createClass({
    mixins: [TooltipMixin],
    getInitialState: function() {
        return {showMain: true};
    },
    handleShowMore: function() {
        this.setState({showMain: !this.state.showMain});
    },
    componentDidUpdate: function() {
        this.componentDidMount();
    },
    render: function() {
        var puff = this.props.puff;
        var className = 'bar' + (this.props.hidden ? ' hidden' : '')
        var canViewRaw = puff.payload.type=='bbcode'||puff.payload.type=='markdown'||puff.payload.type=='PGN';

        var polyglot = Translate.language[puffworldprops.view.language];
        if (!this.state.showMain) {
            return (
                <div className={className}>
                    {canViewRaw ? <PuffViewRaw sig={puff.sig} /> : ''}
                    {puff.payload.type == 'image' ? <PuffViewImage puff={puff} /> : ""}
                    <PuffJson puff={puff} />
                    <PuffPermaLink sig={puff.sig} />
                    <PuffExpand puff={puff} />
                    
                    <span className ="icon" onClick={this.handleShowMore}>
                        <a><i className="fa fa-ellipsis-h fa-fw"></i></a>
                        <Tooltip position="above" content={polyglot.t("menu.tooltip.seeMore")} />
                    </span>
                </div>
            );
        }
        //
        return (
            <div className={className}>
                <PuffFlagLink sig={puff.sig} username={puff.username} />
                <PuffTipLink username={puff.username} />
                <PuffInfoLink puff={puff} />
                <PuffParentCount puff={puff} />
                <PuffChildrenCount puff={puff} />
                <PuffReplyLink sig={puff.sig} />
                <PuffStar sig={puff.sig} />
                <span className ="icon" onClick={this.handleShowMore}>
                    <a><i className="fa fa-ellipsis-h fa-fw"></i></a>
                    <Tooltip position="above" content={polyglot.t("menu.tooltip.seeMore")} />
                </span>
            </div>
        );
    }
});

var PuffViewImage = React.createClass({
    render: function() {
        var puff = this.props.puff;
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <span className ="icon">
                <a href={puff.payload.content} target="new"><i className="fa fa-search-plus fa-fw"></i></a>
                <Tooltip position="above" content={polyglot.t("menu.tooltip.viewImage")}/>
            </span>
        );
    }
});

var PuffJson = React.createClass({
    handleClick: function() {
        var jsonstring = JSON.stringify(this.props.puff);
        var jswin = window.open("");
        jswin.document.write(jsonstring);
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <span className ="icon" onClick={this.handleClick}>
                <a><i className="fa fa-cubes fa-fw"></i></a>
                <Tooltip position="above" content={polyglot.t("menu.tooltip.json")}/>
            </span>
        )
    }
 });

var PuffFlagLink = React.createClass({

    getInitialState: function() {
        return {flagged: false}
    },

    handleFlagRequest: function() {
        var self = this;
        var prom = PuffForum.flagPuff(self.props.sig);

        prom.then(function(result) {
                self.setState({flagged: true});
            })
            .catch(function(err) {
               alert(err);
            });

        return false;
    },

    render: function() {
        var cx1 = React.addons.classSet;
        var newClass = cx1({
            'fa fa-bomb fa-fw': true,
            'red': this.state.flagged,
            'black': !this.state.flagged
        });
        var polyglot = Translate.language[puffworldprops.view.language];

        // Does this user have right to flag?
        if(PuffWardrobe.getCurrentUsername() == this.props.username || PuffWardrobe.getCurrentUsername() == CONFIG.zone) {
            return (
                <span>
                    <a href="#" onClick={this.handleFlagRequest}><i className={newClass} ></i></a>
                    <Tooltip position="above" content={polyglot.t("menu.tooltip.flagLink")} />
                </span>
            )
        } else {
            return <i></i>
        }

    }
});



var PuffParentCount = React.createClass({
    handleClick: function() {
        var puff  = this.props.puff;
        return events.pub('ui/show/parents', { 'view.mode': 'list'
                                             , 'view.query': puffworlddefaults.view.query
                                             , 'view.query.focus': puff.sig
                                             , 'view.query.ancestors': 1
                                             })
    },
    render: function() {
        var puff = this.props.puff;
        var parents = PuffForum.getParents(puff)
        var polyglot = Translate.language[puffworldprops.view.language];
        if (parents.length==0) {
            return (
                    <span>
                        <span className="click droid"><span ref="count" >0</span> </span>
                        <Tooltip position="above" content={polyglot.t("menu.tooltip.parent")} />
                    </span>
           );
        }
        else {
            return (
                <span>
                    <a href={'#' + this.props.sig} onClick={this.handleClick}>
                        <span ref="count droid">{parents.length} </span>
                    </a>
                    <Tooltip position="above" content={polyglot.t("menu.tooltip.parent")}/>
                </span>
            );
        }
    }
});

/**
 *
 * Show the Info icon and pop-up the information window
 */
var PuffInfoLink = React.createClass({
    componentDidMount: function(){
        var node = this.getDOMNode();
        var infoLink = node.getElementsByClassName('infoLink')[0];
        var detailInfo = node.getElementsByClassName('detailInfo')[0];

        infoLink.onmouseover = function() {
            detailInfo.style.display = 'block';
        }
        infoLink.onmouseout = function() {
            detailInfo.style.display = 'none';
        }
    },
    render: function() {
        var puff = this.props.puff;
        var date = new Date(puff.payload.time);
        var formattedTime = <span>Created {timeSince(date)} ago</span>;
        var lisc = puff.payload.license ?  <span><br/>License: {puff.payload.license}</span> : '';

        var type = <span><br/>Type: {puff.payload.type}</span>

        // var quote = puff.payload.quote ?  <span><br/>Quote: {puff.payload.quote}</span> : '';

        var photographer = puff.photographer ? <span><br/>Photographer: {puff.photographer}</span> : '';
        var version = <span><br/> Version: {puff.version}</span>;
   //     var altText = formattedTime + ' ' + lisc + ' ' + photographer + ' ' + version;

        return (
            <span className="icon">
                <a><span className="infoLink">
                    <i className="fa fa-info fa-fw"></i>
                    <span className="detailInfo">
                    {formattedTime}
                    {type}
                    {lisc}
                    {photographer}
                    </span>
                </span></a>
            </span>
            );
    }
});

var PuffTipLink = React.createClass({
    getInitialState: function() {
        return {
            showTipButtons: false
        };
    },

    handleToggleTipInfo: function(){
        var node = this.getDOMNode();
        var walletInfo = node.getElementsByClassName('walletInfo')[0];

        if(!this.state.showTipButtons) {
            this.setState({showTipButtons: true});
            walletInfo.style.display = 'block';

        } else {
            this.setState({showTipButtons: false});
            walletInfo.style.display = 'none';
        }
        return false;
    },

    render: function() {
        if(this.state.showTipButtons) {

            var tipButtons = <TipButton currency="BTC" username={this.props.username} />
        } else {
            var tipButtons = ''
        }

        return (
            <span className="icon">
            <span className="walletLink">
                <a href="#" onClick={this.handleToggleTipInfo}>
                    <i className="fa fa-gittip fa-fw"></i>
                </a>
                <span className="walletInfo">
                    {tipButtons}
                </span>
            </span>
            </span>
            );
    }
});

var TipButton = React.createClass({
    getInitialState: function() {
        return {
            publicKey: '',
            btcAddy: '',
            akShort: ''
        };
    },

    componentDidMount: function(){
        // Get the public key for this user, convert to wallet
        // TODO: Get the link so have meta-data set, like "From puffball"



        var self = this;
        var prom = Puffball.getUserRecord(this.props.username);

        prom.then(function(result) {

            self.setState({publicKey: result.adminKey});
            console.log(result.adminKey);

            var btcAddy = Puffball.Crypto.wifToPubKey(result.adminKey);

            console.log(btcAddy);

            btcAddy = btcAddy.getAddress().toString();
            self.setState({btcAddy: btcAddy});

            console.log("HI");

            var akShort = btcAddy.substr(0,5)+'...';
            self.setState({akShort: akShort});



            events.pub('ui/tipbutton/userlookup', {});

            return false;
        })
            .catch(function(err) {
                console.log("PROBLEM");

                self.setState({publicKey: false});
                this.setState({btcAddy: 'Unknown :-('});
                this.setState({akShort: 'FAIL'});
                events.pub('ui/tipbutton/userlookup/failed', {});
                return false;
            })
    },

    render: function() {
        if(this.state.btcAddy)
            return (
                    <div className="tip">
                        Tip user: <a href={"bitcoin:" + this.state.btcAddy}><i className="fa fa-bitcoin fa-fw"></i></a>
                    </div>
            )

        return <i className="fa fa-fw fa-spinner"></i>
    }

});


var PuffViewRaw = React.createClass({
    handleClick:function() {
        var sig = this.props.sig;
        var rawPuff = puffworldprops.raw.puffs
            ? puffworldprops.raw.puffs.slice() 
            : [];
        var index = rawPuff.indexOf(sig);
        if(index == -1) {
            rawPuff.push(sig)
        } else {
            rawPuff.splice(index, 1)
        }

        return events.pub('ui/raw/add-raw', {'raw': {puffs: rawPuff}});
    },
    render: function() {
        var rawPuff = puffworldprops.raw.puffs
            ? puffworldprops.raw.puffs.slice() 
            : [];
        var cx1 = React.addons.classSet;
        var index   = rawPuff.indexOf(this.props.sig)
        if(index == -1) {
            var isGreen = false;
        } else {
            var isGreen = true;
        }

        var newClass = cx1({
            'fa fa-code fa-fw': true,
            'green': isGreen
        });

        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <span className="icon">
                <a href="#" onClick={this.handleClick}>
                    <i className={newClass}></i>
                </a>
                <Tooltip position="above" content={polyglot.t("menu.tooltip.viewRaw")}/>
            </span>
        );
    }

})

var PuffChildrenCount = React.createClass({
    handleClick: function() {
        var puff  = this.props.puff;
        return events.pub('ui/show/parents', { 'view.mode': 'list'
                                             , 'view.query': puffworlddefaults.view.query
                                             , 'view.query.focus': puff.sig
                                             , 'view.query.descendants': 1
                                             })
    },
    render: function() {
        var puff = this.props.puff;
        var children = PuffForum.getChildren(puff)
        var polyglot = Translate.language[puffworldprops.view.language];
        if (children.length==0) {
            return (
                <span>
                    <span className="click droid"><span ref="count">0</span> </span>
                    <Tooltip position="above" content={polyglot.t("menu.tooltip.children")}/>
                </span>
            );
        }
        else {
            return (
                <span>
                    <a href={'#' + this.props.sig} onClick={this.handleClick}>
                        <span ref="count droid">{children.length} </span>
                    </a>
                    <Tooltip position="above" content={polyglot.t("menu.tooltip.children")}/>
                </span>
            );
        }
    }
});

var PuffPermaLink = React.createClass({
    handleClick: function() {
        var sig  = this.props.sig;
        // var puff = PuffForum.getPuffBySig(sig);
        showPuff(sig);
        return false;
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <span className="icon">
                <a href={'#' + this.props.sig} onClick={this.handleClick}>
                    <i className="fa fa-link fa-fw"></i>
                </a>
                <Tooltip position="above" content={polyglot.t("menu.tooltip.permaLink")}/>
            </span>
        );
    }
});

var PuffReplyLink = React.createClass({
    handleClick: function() {
        // TODO: make this a toggle. Does it already?
        // TODO: Remove coloring when submit puff

        var sig = this.props.sig;

        var parents = puffworldprops.reply.parents          // OPT: global props hits prevent early bailout
            ? puffworldprops.reply.parents.slice()          // clone to keep pwp immutable
            : []

        var index = parents.indexOf(sig)

        if(index == -1) {
            parents.push(sig)
        } else {
            parents.splice(index, 1)
        }

        var menu = PB.shallow_copy(puffworldprops.menu);    // don't mutate directly!
        if (!puffworldprops.reply.expand) {
            menu.show = true;
            menu.section = 'publish';
        }
        return events.pub('ui/reply/add-parent', { 'reply.parents': parents
                                                 , 'menu': menu
                                                 });

        // TODO: draw reply arrows. Maybe
    },
    render: function() {
        var parents = puffworldprops.reply.parents          // OPT: global props hits prevent early bailout
            ? puffworldprops.reply.parents.slice()          // clone to keep pwp immutable
            : []
        var cx1 = React.addons.classSet;
        var index   = parents.indexOf(this.props.sig)

        if(index == -1) {
            var isGreen = false;
        } else {
            var isGreen = true;
        }

        var newClass = cx1({
            'fa fa-reply fa-fw': true,
            'green': isGreen
        });

        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <span className="icon">
                <a href="#" onClick={this.handleClick}>
                    <i className={newClass}></i>
                </a>
                <Tooltip position="above" content={polyglot.t("menu.tooltip.reply")}/>
            </span>
        );
    }
});


var PuffExpand = React.createClass({
    handleClick: function() {
        var puff = this.props.puff;
        var row = puffworldprops.view.rows == 1 ? puffworlddefaults.view.rows : 1;
        return events.pub("ui/expand-puff", { 'view.mode': 'focus'
                                            , 'view.filters': puffworlddefaults.view.filters
                                            , 'view.query': puffworlddefaults.view.query
                                            , 'view.query.focus': puff.sig
                                            , 'menu': puffworlddefaults.menu
                                            , 'reply': puffworlddefaults.reply
                                            , 'view.rows': row
                                            })
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var expand = puffworldprops.view.rows == 1 ? "compress" : "expand";
        // var iconClass = puffworldprops.view.rows == 1 ? "fa fa-compress fa-fw" : "fa fa-expand fa-fw";
        return (
            <span className="icon">
                <a href="#" onClick={this.handleClick}>
                    <i className={"fa fa-fw fa-"+expand}></i>
                </a>
                <Tooltip position="above" content={polyglot.t("menu.tooltip."+expand)}/>
            </span>
        );
    }
});


var PuffStar = React.createClass({
    filterCurrentUserStar: function(s){
        var username = PuffWardrobe.getCurrentUsername();
        return s.username == username;
    },
    updateScore: function() {
        var topLevelUser = this.state.starShells.filter(function(s){return s.username.indexOf('.') == -1}).length;
        var anonUser = this.state.starShells.filter(function(s){return s.username.indexOf('.') != -1}).length;
        var scorePref = puffworldprops.view.score;
        var score = topLevelUser * scorePref.tluValue + Math.min(scorePref.maxAnonValue, scorePref.anonValue * anonUser);
        console.log(score, 'score', topLevelUser, anonUser);
        return this.setState({score: score});
    },
    getInitialState: function(){
        var sig = this.props.sig;
        var username = PuffWardrobe.getCurrentUsername();
        var allStarShells = PuffForum.getShells()
                                     .filter(function(s){
                                        return s.payload.type == 'star' && 
                                               s.payload.content == sig;
                                      });
        var userStar = allStarShells.filter(this.filterCurrentUserStar);
        var starred = userStar.length != 0;
        return {
            score: 0,
            starShells: allStarShells,
            color: starred ? 'yellow': 'black'
        }
    },
    componentDidMount: function(){
        this.updateScore();
    },
    handleClick: function() {
        var username = PuffWardrobe.getCurrentUsername();
        var starred = this.state.starShells.filter(this.filterCurrentUserStar);
        if (starred.length != 0) {
            var self = this;
            var sig = starred[0].sig;
            var prom = PuffForum.flagPuff(sig);
            var starShells = this.state.starShells
                                       .filter(function(s){return s.sig != sig;});
            prom.then(function(result) {
                    self.setState({starShells: starShells,
                                   color: 'black'});
                    self.updateScore();
                })
                .catch(function(err) {
                   alert(err);
                });
        } else {
            this.setState({color: 'gray'});
            var self = this;
            var content = this.props.sig;
            var type = 'star';

            var userprom = PuffWardrobe.getUpToDateUserAtAnyCost();
            var takeUserMakePuff = PuffForum.partiallyApplyPuffMaker(type, content, [], {}, []);
            var prom = userprom.catch(Puffball.promiseError('Failed to add post: could not access or create a valid user'));
            prom.then(takeUserMakePuff)
                .then(function(puff){
                    var starShells = self.state.starShells;
                    starShells.push(puff);
                    self.setState({
                        starShells: starShells,
                        color: 'yellow'
                    });
                    self.updateScore();
                })
                .catch(Puffball.promiseError('Posting failed'));
        }
        return false;
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var score = this.state.score;
        return (
            <span className="icon">
                <a href="#" onClick={this.handleClick}>
                    <i className={"fa fa-fw fa-star "+this.state.color}></i>
                </a>{score}
            </span>
        );
    }
})